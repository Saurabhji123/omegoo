/**
 * Python Filter Client
 * Connects to Python backend for real video filtering
 */

export class PythonFilterClient {
  private ws: WebSocket | null = null;
  private connected: boolean = false;
  private currentFilter: string = 'none';
  private videoElement: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private processedStream: MediaStream | null = null;
  private processingInterval: number | null = null;
  private frameQueue: string[] = [];
  private isProcessing: boolean = false;

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Connect to Python filter service
        this.ws = new WebSocket('ws://localhost:8002/ws/filter');

        this.ws.onopen = () => {
          console.log('✅ Connected to Python filter service');
          this.connected = true;
          resolve();
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          reject(new Error('Failed to connect to filter service'));
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(JSON.parse(event.data));
        };

        this.ws.onclose = () => {
          console.log('❌ Disconnected from Python filter service');
          this.connected = false;
        };
      } catch (error) {
        console.error('❌ Failed to create WebSocket:', error);
        reject(error);
      }
    });
  }

  async startProcessing(stream: MediaStream, filterType: string = 'none'): Promise<MediaStream> {
    if (!this.connected) {
      console.warn('⚠️ Not connected to filter service, using original stream');
      return stream;
    }

    this.currentFilter = filterType;

    // Create video element to capture frames
    this.videoElement = document.createElement('video');
    this.videoElement.srcObject = stream;
    this.videoElement.autoplay = true;
    this.videoElement.playsInline = true;
    this.videoElement.muted = true;

    await new Promise<void>((resolve) => {
      this.videoElement!.onloadedmetadata = () => {
        this.videoElement!.play();
        resolve();
      };
    });

    // Create canvas for processed output
    this.canvas = document.createElement('canvas');
    this.canvas.width = 640;
    this.canvas.height = 480;
    this.ctx = this.canvas.getContext('2d');

    if (!this.ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Set initial filter
    this.setFilter(filterType);

    // Start frame processing loop
    this.startFrameProcessing();

    // Capture processed stream
    this.processedStream = this.canvas.captureStream(30);

    // Add audio from original stream
    stream.getAudioTracks().forEach(track => {
      this.processedStream!.addTrack(track);
    });

    console.log('✅ Python filter processing started');
    return this.processedStream;
  }

  private startFrameProcessing(): void {
    // Process at 15 FPS (balance between quality and performance)
    this.processingInterval = window.setInterval(() => {
      if (!this.videoElement || !this.canvas || !this.ctx) return;

      // Draw current video frame to canvas
      this.ctx.drawImage(this.videoElement, 0, 0, this.canvas.width, this.canvas.height);

      // Get frame as base64
      const frameData = this.canvas.toDataURL('image/jpeg', 0.8);

      // Send to Python backend for processing
      if (this.ws && this.ws.readyState === WebSocket.OPEN && !this.isProcessing) {
        this.isProcessing = true;
        this.ws.send(JSON.stringify({
          type: 'process_frame',
          frame: frameData
        }));
      }
    }, 1000 / 15); // 15 FPS
  }

  private handleMessage(data: any): void {
    if (data.type === 'processed_frame') {
      // Draw processed frame back to canvas
      const img = new Image();
      img.onload = () => {
        if (this.ctx && this.canvas) {
          this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
        }
        this.isProcessing = false;
      };
      img.src = data.frame;
    } else if (data.type === 'filter_updated') {
      console.log(`✅ Filter updated to: ${data.filter}`);
    }
  }

  setFilter(filterType: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('⚠️ Cannot set filter, not connected');
      return;
    }

    this.currentFilter = filterType;
    this.ws.send(JSON.stringify({
      type: 'set_filter',
      filter: filterType
    }));
    console.log(`🎭 Setting Python filter: ${filterType}`);
  }

  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.videoElement = null;
    this.canvas = null;
    this.ctx = null;
    this.processedStream = null;
    
    console.log('🛑 Python filter processing stopped');
  }

  isConnected(): boolean {
    return this.connected;
  }
}

// Singleton instance
export const pythonFilterClient = new PythonFilterClient();
