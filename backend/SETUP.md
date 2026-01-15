# Backend Setup Guide

## Python Version Compatibility

**Note:** Python 3.14 is very new and some packages may not have full support yet. If you encounter build errors, we recommend using **Python 3.11** or **Python 3.12** which are more stable and widely supported.

## Installation Steps

### Option 1: Using Python 3.11 or 3.12 (Recommended)

1. **Create virtual environment with specific Python version:**
```bash
# Using pyenv (if installed)
pyenv install 3.12.0
pyenv local 3.12.0

# Or using Homebrew Python 3.12
python3.12 -m venv .venv
source .venv/bin/activate
```

2. **Install dependencies:**
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Option 2: Using Python 3.14 (Current)

If you want to use Python 3.14, try installing with the updated requirements:

```bash
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

If `pydantic-core` still fails to build, you can try installing a pre-built wheel:

```bash
pip install --only-binary :all: pydantic
```

Or use the latest versions without pinning:

```bash
pip install fastapi uvicorn[standard] motor pymongo pydantic pydantic-settings python-jose[cryptography] passlib[bcrypt] python-multipart python-dotenv email-validator
```

## Running the Server

1. **Make sure MongoDB is running:**
```bash
# macOS with Homebrew
brew services start mongodb-community

# Or Docker
docker run -d -p 27017:27017 --name mongodb mongo
```

2. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your settings
```

3. **Start the server:**
```bash
./run.sh
# Or manually:
uvicorn app.main:app --reload --port 8000
```

## Troubleshooting

### pydantic-core build errors

If you see errors building `pydantic-core`, try:

1. **Use Python 3.11 or 3.12** (most reliable)
2. **Install pre-built wheels:**
   ```bash
   pip install --only-binary :all: -r requirements.txt
   ```
3. **Update pip and setuptools:**
   ```bash
   pip install --upgrade pip setuptools wheel
   ```

### MongoDB connection errors

Make sure MongoDB is running:
```bash
# Check if MongoDB is running
brew services list | grep mongodb

# Start if not running
brew services start mongodb-community
```
