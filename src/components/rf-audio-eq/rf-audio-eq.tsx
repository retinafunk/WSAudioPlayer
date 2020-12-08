import {Component, Host, h, Prop,Element,State} from '@stencil/core';

/* Based on this source https://codepen.io/nelsonr/pen/WamzJb*/
/* forked by retinasfunk:  https://codepen.io/retinafunk/pen/eYdzKKr?editors=1010*/

@Component({
  tag: 'rf-audio-eq',
  styleUrl: 'rf-audio-eq.css',
  shadow: true,
})
export class RfAudioEq {

  @Prop() audioSource='';
  @Prop() color='limegreen';
  @Element() el: HTMLElement;

  private audioContext: AudioContext;
  private canvasContext: any;
  private audioDataArrayL: any;
  private audioDataArrayR: any;
  private analyserL: any;
  private analyserR: any;
  private bufferLengthL: any;
  private bufferLengthR: any;
  private pointsUp= [];
  private pointsDown= [];
  private audio: any;
  private running = false;
  private splitter;
  private pCircle;
  private centerX;
  private centerY;
  private radius;
  private canvas;
  // @ts-ignore
  setupVisualizer(){
    this.canvas = this.el.shadowRoot.querySelector("#canvas");

    document.body.addEventListener('click',
      () => {
      this.audioContext.resume();
    });
    console.log('Canvas!!!:',this.canvas);
    this.canvas.addEventListener('click', ()=>this.toggleAudio());
    this.canvasContext = this.canvas['getContext']("2d");

/*    this.canvas['width'] = document.body.clientWidth;
    this.canvas['height'] = document.body.clientHeight;*/

    this.canvas['width'] = this.el.parentElement.clientWidth;
    this.canvas['height'] = this.el.parentElement.clientHeight;

    this.centerX = this.canvas['width'] / 2;
    this.centerY = this.canvas['height'] / 2;
    this.radius = document.body.clientWidth <= 425 ? 120 : 160;
    let steps = document.body.clientWidth <= 425 ? 60 : 120;
    let interval = 360 / steps;
    this.pointsUp = [];
    this.pointsDown = [];
    this.running = false;
    this.pCircle = 2 * Math.PI * this.radius;
    let angleExtra = 90;

// Create points
    for(let angle = 0; angle < 360; angle += interval) {
      let distUp = 1.1;
      let distDown = 0.9;


      const newPoint:any = {
        angle: angle + angleExtra,
        x: this.centerX + this.radius * Math.cos((-angle + angleExtra) * Math.PI / 180) * distUp,
        y: this.centerY + this.radius * Math.sin((-angle + angleExtra) * Math.PI / 180) * distUp,
        dist: distUp
      }
      this.pointsUp.push(newPoint);

      this.pointsDown.push({
        angle: angle + angleExtra + 5,
        x: this.centerX + this.radius * Math.cos((-angle + angleExtra + 5) * Math.PI / 180) * distDown,
        y: this.centerY + this.radius * Math.sin((-angle + angleExtra + 5) * Math.PI / 180) * distDown,
        dist: distDown
      });
    }
  }

  setupAudio(){
    console.log('setupAudio()');
// make a Web Audio Context
    const context = new AudioContext();
    this.audioContext = context;
    this.splitter = context.createChannelSplitter();

    this.analyserL = context.createAnalyser();
    this.analyserL.fftSize = 8192;

    this.analyserR = context.createAnalyser();
    this.analyserR.fftSize = 8192;

    this.splitter.connect(this.analyserL, 0, 0);
    this.splitter.connect(this.analyserR, 1, 0);

// Make a buffer to receive the audio data
    this.bufferLengthL = this.analyserL.frequencyBinCount;
    this.audioDataArrayL= new Uint8Array(this.bufferLengthL);

    this.bufferLengthR = this.analyserR.frequencyBinCount;
    this.audioDataArrayR = new Uint8Array(this.bufferLengthR);
    if(window['currentAudioElement'] === undefined) {
      this.audio = new Audio();
    } else{
      this.audio = window['currentAudioElement'];
    }
    console.log('this.audio',this.audio);
    this.handleCanplay();
    //this.audio.addEventListener('canplay', ()=>this.handleCanplay());
    this.running = true;
    this.draw('x');
   // this.loadAudio();
  }

  loadAudio(){
    console.log('loadAudio()');

    this.audio.loop = false;
    this.audio.autoplay = false;
    this.audio.crossOrigin = "anonymous";
   // this.audio.volume = 0.01;

    this.audio.addEventListener('canplay', ()=>this.handleCanplay());
    this.audio.src = "https://s3.eu-west-2.amazonaws.com/nelsoncodepen/Audiobinger_-_The_Garden_State.mp3";
    this.audio.load();
    this.running = true;

    this.draw('x');
  }

  handleCanplay() {
// connect the audio element to the analyser node and the analyser node
// to the main Web Audio context
    const source = this.audioContext.createMediaElementSource(this.audio);
    source.connect(this.splitter);
    this.splitter.connect(this.audioContext.destination);
    console.log('handleCanplay');
  }

  toggleAudio() {
    console.log('toggleAudio()',this.running);
    if (this.running === false) {
      this.loadAudio();
      return;
    }
    if (this.audio.paused) {
      this.audio.play();

    } else {
      this.audio.pause();
    }
  }

  drawLine(points) {
    let origin = points[0];

    this.canvasContext.beginPath();
    this.canvasContext.strokeStyle =  this.color;
    this.canvasContext.lineJoin = 'round';
    this.canvasContext.moveTo(origin.x, origin.y);

    for (let i = 0; i < points.length; i++) {
      this.canvasContext.lineTo(points[i].x, points[i].y);
    }

    this.canvasContext.lineTo(origin.x, origin.y);
    this.canvasContext.stroke();
  }

  connectPoints(pointsA, pointsB) {
    for (let i = 0; i < pointsA.length; i++) {
      this.canvasContext.beginPath();
      this.canvasContext.strokeStyle = this.color;
      this.canvasContext.moveTo(pointsA[i].x, pointsA[i].y);
      this.canvasContext.lineTo(pointsB[i].x, pointsB[i].y);
      this.canvasContext.stroke();
    }
  }

  update(dt) {
    let audioIndex, audioValue;
    console.log('update');
// get the current audio data
    this.analyserL.getByteFrequencyData(this.audioDataArrayL);
    this.analyserR.getByteFrequencyData(this.audioDataArrayR);

    for (let i = 0; i < this.pointsUp.length; i++) {
      audioIndex = Math.ceil(this.pointsUp[i]['angle'] * (this.bufferLengthL / ( this.pCircle * 2))) | 0;
// get the audio data and make it go from 0 to 1
      audioValue =  this.audioDataArrayL[audioIndex] / 255;

      this.pointsUp[i]['dist'] = 1.1 + audioValue * 0.8;
      this.pointsUp[i]['x'] = this.centerX + this.radius * Math.cos(-this.pointsUp[i]['angle'] * Math.PI / 180) * this.pointsUp[i]['dist'];
      this.pointsUp[i]['y']= this.centerY + this.radius * Math.sin(-this.pointsUp[i]['angle'] * Math.PI / 180) * this.pointsUp[i]['dist'];

      audioIndex = Math.ceil(this.pointsDown[i]['angle'] * (this.bufferLengthR / (this.pCircle * 2))) | 0;
// get the audio data and make it go from 0 to 1
      audioValue =  this.audioDataArrayR[audioIndex] / 255;

      this.pointsDown[i]['dist'] = 0.9 + audioValue * 0.2;
      this.pointsDown[i]['x']  = this.centerX + this.radius * Math.cos(-this.pointsDown[i]['angle'] * Math.PI / 180) * this.pointsDown[i]['dist'];
      this.pointsDown[i]['y'] = this.centerY + this.radius * Math.sin(-this.pointsDown[i]['angle'] * Math.PI / 180) * this.pointsDown[i]['dist'];
    }
  }

  draw(dt) {

    requestAnimationFrame(()=>{this.draw('x')});

    if (this.running) {
      this.update(dt);
    }

    this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawLine(this.pointsUp);
    this.drawLine(this.pointsDown);
    this.connectPoints(this.pointsUp, this.pointsDown);
  }

  componentDidRender(){
    this.setupVisualizer();
    this.setupAudio();
    console.log({test:this.audioContext});
  }

  render() {
    return (
      <Host>
        <canvas id="canvas" width="460" height="320"> </canvas>
      </Host>
    );
  }

}
