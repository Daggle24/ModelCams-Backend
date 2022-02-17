import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import  * as mediasoup  from 'mediasoup'
import * as process from 'process'
const mediaCodecs = [
    {
        kind: 'audio',
        mimeType:'audio/opus',
        clockRate: 48000,
        channels: 2,
    },
    {
        kind: 'video',
        mimeType:'video/H264',
        clockRate: 90000,
        parameters:{
            'x-google-start-bitrate': 1000,
        }
    },
    {
        kind: 'video',
        mimeType: 'video/VP8',
        clockRate: 90000,
        parameters: {
          'x-google-start-bitrate': 1000,
        },
      },
]
@Injectable()
export class VideoStreamService {

    constructor(private configService: ConfigService) { }
    public worker
    public router
    
    async createWorker(){
      console.log(mediasoup.version)
        this.worker = await mediasoup.createWorker({
            logLevel: 'warn',
            rtcMinPort:2000,
            rtcMaxPort:2020
    })
    console.log(`worker pid: ${this.worker.pid}`)

    this.worker.on('died',(error)=>{
        console.log('worker died: ',error)
        setTimeout(()=>{process.exit(1)},2000)
    })
        return this.worker
    }

    async createRouter(){
        console.log('intentando crear router') 
        console.log(this.worker.pid)
        this.router = await this.worker.createRouter({mediaCodecs})
        return this.router
    }



    async createWebRtcTransport(data){
        try {
            const webRtcTransport_options = {
                listenIps:[{
                    ip:'0.0.0.0',
                    announcedIp:this.configService.get('RTC_ANNOUNCED_IP')
                }],
                enableUdp:true,
                enableTcp:true,
                preferUdp:true,
            }
         

            let transport = await this.router.createWebRtcTransport(webRtcTransport_options)
            console.log('is this a sender request?', data.sender)
            console.log('transportId: ',transport.id)
            transport.on('dtlsstatechange', dtlsState =>{
                if (dtlsState === 'closed'){
                    transport.close()
                }
            })
            transport.on('close',()=>{
                console.log('transsport closed')
            })
          
               let params ={
                    id:transport.id,
                    iceParameters:transport.iceParameters,
                    iceCandidates:transport.iceCandidates,
                    dtlsParameters:transport.dtlsParameters,
                    sctpParameters:transport.sctpParameters, 
                }
                return [transport,params]
          

         

        } catch (error) {
            console.log(error)
           
                let params = {
                    error:error
                }
                return params
           
        }
    }

    

}
