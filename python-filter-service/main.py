"""
AR Filter Service - Python Backend
Handles real-time video filters with OpenCV
"""
try:
    import cv2
    import numpy as np
    from fastapi import FastAPI, WebSocket, WebSocketDisconnect
    from fastapi.middleware.cors import CORSMiddleware
    import base64
    import json
    from typing import Dict, Optional
    import asyncio
    import sys
    
    print("✅ All dependencies loaded successfully")
except ImportError as e:
    print(f"❌ Missing dependency: {e}")
    print("Run: pip install -r requirements.txt")
    sys.exit(1)

app = FastAPI(title="AR Filter Service")

# CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FilterProcessor:
    """Process video frames with different filters"""
    
    def __init__(self):
        self.current_filter = "none"
        
    def apply_filter(self, frame: np.ndarray, filter_type: str) -> np.ndarray:
        """Apply filter to frame based on type"""
        
        if filter_type == "none":
            return frame
            
        elif filter_type == "sunglasses":
            # Cool blue tint
            return self._apply_blue_tint(frame)
            
        elif filter_type == "dog_ears":
            # Warm sepia tone
            return self._apply_sepia(frame)
            
        elif filter_type == "cat_ears":
            # High contrast
            return self._apply_high_contrast(frame)
            
        elif filter_type == "party_hat":
            # Vibrant saturation
            return self._apply_vibrant(frame)
            
        return frame
    
    def _apply_blue_tint(self, frame: np.ndarray) -> np.ndarray:
        """Cool blue tint effect"""
        # Increase blue channel, reduce red
        frame = frame.astype(np.float32)
        frame[:, :, 0] = np.clip(frame[:, :, 0] * 1.2, 0, 255)  # Blue
        frame[:, :, 2] = np.clip(frame[:, :, 2] * 0.8, 0, 255)  # Red
        return frame.astype(np.uint8)
    
    def _apply_sepia(self, frame: np.ndarray) -> np.ndarray:
        """Warm sepia tone"""
        kernel = np.array([
            [0.272, 0.534, 0.131],
            [0.349, 0.686, 0.168],
            [0.393, 0.769, 0.189]
        ])
        return cv2.transform(frame, kernel)
    
    def _apply_high_contrast(self, frame: np.ndarray) -> np.ndarray:
        """High contrast boost"""
        alpha = 1.5  # Contrast
        beta = 0     # Brightness
        return cv2.convertScaleAbs(frame, alpha=alpha, beta=beta)
    
    def _apply_vibrant(self, frame: np.ndarray) -> np.ndarray:
        """Vibrant saturation boost"""
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV).astype(np.float32)
        hsv[:, :, 1] = np.clip(hsv[:, :, 1] * 1.5, 0, 255)  # Saturation
        hsv = hsv.astype(np.uint8)
        return cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)

# Global processor
processor = FilterProcessor()

@app.get("/")
async def root():
    return {"status": "AR Filter Service Running", "version": "1.0.0"}

@app.websocket("/ws/filter")
async def websocket_filter(websocket: WebSocket):
    """WebSocket endpoint for real-time video filtering"""
    await websocket.accept()
    print("✅ Client connected to filter service")
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_json()
            
            message_type = data.get("type")
            
            if message_type == "set_filter":
                # Update current filter
                filter_type = data.get("filter", "none")
                processor.current_filter = filter_type
                print(f"🎭 Filter changed to: {filter_type}")
                await websocket.send_json({
                    "type": "filter_updated",
                    "filter": filter_type
                })
                
            elif message_type == "process_frame":
                # Process video frame
                frame_data = data.get("frame")
                
                # Decode base64 image
                img_bytes = base64.b64decode(frame_data.split(',')[1])
                nparr = np.frombuffer(img_bytes, np.uint8)
                frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                
                # Apply filter
                filtered_frame = processor.apply_filter(frame, processor.current_filter)
                
                # Encode back to base64
                _, buffer = cv2.imencode('.jpg', filtered_frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
                frame_base64 = base64.b64encode(buffer).decode('utf-8')
                
                # Send back to client
                await websocket.send_json({
                    "type": "processed_frame",
                    "frame": f"data:image/jpeg;base64,{frame_base64}"
                })
                
    except WebSocketDisconnect:
        print("❌ Client disconnected from filter service")
    except Exception as e:
        print(f"❌ Error in WebSocket: {e}")
        await websocket.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
