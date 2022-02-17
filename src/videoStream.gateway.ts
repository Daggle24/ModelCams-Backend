import { Logger } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway,OnGatewayConnection, WebSocketServer, OnGatewayInit, OnGatewayDisconnect } from '@nestjs/websockets'
import { Server, Socket } from 'socket.io';
import { VideoStreamService } from './video-stream.service';

@WebSocketGateway({namespace:'videoStreaming', cors:true} )
export class VideoStreamGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect{
    producer: any;
    consumer:any;
    router: any;
   constructor(private videoStreamService:VideoStreamService){

   }
    private logger:Logger = new Logger('VideoStreamGateway');
    public producerTransport;
    public consumerTransport;
    afterInit(server:Server){
    this.videoStreamService.createWorker();
    this.logger.log('initialized');
    }
    @WebSocketServer()
    server:Server;

    async handleConnection(client: Socket, ...args:any[]){
        this.logger.log('Client connected:' + client.id);
        this.server.emit('connection-success',{
            clientId:client.id,
            existProducer:this.producer?true:false
        });
       


     
    }


    handleDisconnect(client: Socket) {
        this.logger.log('Client disconnected:' + client.id);
     
    }


    @SubscribeMessage('createRoom')
    async createRoom(client:Socket,data:any,callback){
        if (this.router === undefined){
            this.router =  await this.videoStreamService.createRouter();
            console.log('Router Id: ',this.router.id);
        }

        return await this.getRtpCapabilities(callback)
    }

    @SubscribeMessage('getRtpCapabilities')
    async getRtpCapabilities(callback?:any){
        const rtpCapabilities = this.videoStreamService.router.rtpCapabilities;
        console.log('Router RTP Capabilities: ',rtpCapabilities)

        return (rtpCapabilities) 
        
    }

    @SubscribeMessage('createWebRtcTransport')
    async createWebRtcTransport(client:Socket,data:any,callback){
        
        let transportAndParams = await this.videoStreamService.createWebRtcTransport(data)
        if (data.sender){
            this.producerTransport = transportAndParams[0]
            return transportAndParams[1]
        } else{
            this.consumerTransport = transportAndParams[0]
            return transportAndParams[1]
        }
    }


    @SubscribeMessage('transport-produce')
    async transportProduce(client:Socket,{kind,rtpParameters,appData},callback){
       this.producer = await this.producerTransport.produce({kind,rtpParameters})
        console.log('ProducerId: ',this.producer.id, this.producer.kind)
       this.producer.on('transportclose',()=>{
           console.log('transport for this producer closed')
           this.producer.close()
           
       })

       return {id:this.producer.id} 

    }


    @SubscribeMessage('transport-recv-connect')
    async transportRecvConnect(client:Socket,{dtlsParameters}){
        console.log('DTLS Parameters: ',dtlsParameters)
        await this.consumerTransport.connect({dtlsParameters})
    }

    
    @SubscribeMessage('transport-connect')
    async transportConnect(client:Socket,{dtlsParameters}){
    console.log('DTLS Parameters: ',dtlsParameters)
    await this.producerTransport.connect({dtlsParameters})


    }

 

    @SubscribeMessage('consume')
    async consume(client:Socket,{rtpCapabilities},callback:Function){
      
        try {
            console.log('el router',this.router)
            console.log('el producer id:', this.producer.id)
            if(this.router.canConsume({
                producerId:this.producer.id,
                rtpCapabilities
            })){
                this.consumer = await this.consumerTransport.consume({
                   producerId:this.producer.id,
                   rtpCapabilities,
                   paused:true
                })
                console.log('consumer created, id: ',this.consumer.id)
                this.consumer.on('transportclose',()=>{
                    console.log('transport for this consumer closed')
                    
                })

                this.consumer.on('producerclose',()=>{
                 console.log('producer for this consumer closed')
                    //this.consumer.close()
                })

                let params = {
                    id: this.consumer.id,
                    producerId: this.producer.id,
                    kind: this.consumer.kind,
                    rtpParameters: this.consumer.rtpParameters
                }
                return({ params }) 
            }

            
        } catch (error) {
        console.log(error.message)
        return{
            params:{
                error:error
            }
           
        }
        }
    }

    @SubscribeMessage('consumer-resume')
    async consumerResume(client:Socket,data?:any){
        console.log('resuming consumer')
        console.log('consumer resume')
        await this.consumer.resume()
    }
}

