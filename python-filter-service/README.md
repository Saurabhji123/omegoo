# Python AR Filter Service

OpenCV-based video filter service for Omegoo.

## Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Run server
python main.py
```

Server runs on: http://localhost:8001

## API

### WebSocket: `/ws/filter`

**Set Filter:**
```json
{
  "type": "set_filter",
  "filter": "sunglasses"
}
```

**Process Frame:**
```json
{
  "type": "process_frame",
  "frame": "data:image/jpeg;base64,..."
}
```

## Available Filters

- `none` - No filter
- `sunglasses` - Cool blue tint
- `dog_ears` - Warm sepia
- `cat_ears` - High contrast
- `party_hat` - Vibrant saturation
