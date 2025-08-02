"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Camera, RotateCcw, Volume2, VolumeX, Sun, Moon, Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const COMPLIMENTS = [
  "Certified Handsome!",
  "Queen Energy Detected",
  "Your smile just broke the internet!",
  "Meme-Worthy Face Detected",
  "Absolutely Stunning!",
  "Main Character Vibes",
  "You're literally glowing!",
  "Flawless Human Detected",
  "Warning: Too Much Beauty",
  "Professional Model Status",
  "You just won the genetic lottery!",
  "Face Card Never Declines!",
]

const MOODS = [
  { emoji: "😴", text: "Sleepy Potato" },
  { emoji: "🤪", text: "Chaotic Genius" },
  { emoji: "😎", text: "Cool Cucumber" },
  { emoji: "🥳", text: "Party Animal" },
  { emoji: "🤓", text: "Smart Cookie" },
  { emoji: "😇", text: "Angel Baby" },
  { emoji: "🔥", text: "Fire Energy" },
  { emoji: "⚡", text: "Electric Vibes" },
]

// Generate array of image names
const FACE_IMAGES = Array.from({ length: 10 }, (_, i) => `img${i + 1}.jpg`)

export default function AIMirror() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const detectionIntervalRef = useRef<NodeJS.Timeout>()

  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedImageData, setCapturedImageData] = useState<string | null>(null)
  const [randomFaceImage, setRandomFaceImage] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [faceDetected, setFaceDetected] = useState(false)
  const [gender, setGender] = useState<"Boy" | "Woman" | null>(null)
  const [compliment, setCompliment] = useState<string>("")
  const [fakeAge, setFakeAge] = useState<number | null>(null)
  const [iqScore, setIqScore] = useState<number | null>(null)
  const [mood, setMood] = useState<{ emoji: string; text: string } | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(true) // Default to dark mode
  const [isMonkeyMode, setIsMonkeyMode] = useState(false)
  const [isModelLoaded, setIsModelLoaded] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [showResults, setShowResults] = useState(false)

  // Initialize camera
  const initCamera = useCallback(async () => {
    try {
      setCameraError(null)
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
        audio: false,
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play()
          }
        }
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      setCameraError("Camera access denied or not available. Please allow camera permissions.")
    }
  }, [])

  // Load face detection model (simplified simulation)
  useEffect(() => {
    const loadModel = async () => {
      // Simulate model loading time
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setIsModelLoaded(true)
    }
    loadModel()
  }, [])

  // Stable face detection without flickering
  const detectFace = useCallback(() => {
    if (!videoRef.current || !overlayCanvasRef.current || !isModelLoaded || showResults) return

    const video = videoRef.current
    const canvas = overlayCanvasRef.current
    const ctx = canvas.getContext("2d")

    if (!ctx || video.videoWidth === 0 || video.videoHeight === 0) return


    // Only resize and clear if dimensions changed (prevents flicker)
    let resized = false;
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      resized = true;
    }
    if (resized) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    } else {
      // Only clear the face box area, not the whole canvas, to avoid flicker
      // (Optional: you can skip this if you want to keep previous boxes for smoother look)
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Simulate stable face detection
    const hasFace = Math.random() > 0.15 // 85% chance of detecting face for stability

    if (hasFace) {
      // More stable face position simulation
      const centerX = canvas.width * 0.5
      const centerY = canvas.height * 0.4
      const boxWidth = canvas.width * 0.25
      const boxHeight = canvas.height * 0.35

      const x = centerX - boxWidth / 2
      const y = centerY - boxHeight / 2

      // Draw face detection box with smooth animation
      ctx.strokeStyle = "#00ff41"
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.strokeRect(x, y, boxWidth, boxHeight)

      // Draw corner markers
      const cornerSize = 15
      ctx.strokeStyle = "#00ff41"
      ctx.lineWidth = 3
      ctx.setLineDash([])

      // Corners
      const corners = [
        [x, y, x + cornerSize, y, x, y + cornerSize], // Top-left
        [x + boxWidth - cornerSize, y, x + boxWidth, y, x + boxWidth, y + cornerSize], // Top-right
        [x, y + boxHeight - cornerSize, x, y + boxHeight, x + cornerSize, y + boxHeight], // Bottom-left
        [
          x + boxWidth - cornerSize,
          y + boxHeight,
          x + boxWidth,
          y + boxHeight,
          x + boxWidth,
          y + boxHeight - cornerSize,
        ], // Bottom-right
      ]

      corners.forEach(([x1, y1, x2, y2, x3, y3]) => {
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.lineTo(x3, y3)
        ctx.stroke()
      })

      // Add confidence indicator
      ctx.fillStyle = "#00ff41"
      ctx.font = "bold 12px monospace"
      ctx.fillText("FACE: 98.7%", x, y - 5)

      setFaceDetected(true)
    } else {
      setFaceDetected(false)
    }
  }, [isModelLoaded, showResults])

  // Start stable face detection
  useEffect(() => {
    if (stream && videoRef.current && isModelLoaded && !showResults) {
      // Use interval instead of requestAnimationFrame for more stable detection
       // 10 FPS for stability

      return () => {
        if (detectionIntervalRef.current) {
          clearInterval(detectionIntervalRef.current)
        }
      }
    }
  }, [stream, isModelLoaded, detectFace, showResults])

  // Initialize camera on mount
  useEffect(() => {
    initCamera()
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current)
      }
    }
  }, [initCamera, stream])

  // Dark mode effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [isDarkMode])

  const playSound = () => {
    if (!isMuted && audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch((e) => console.log("Audio play failed:", e))
    }
  }

  const generateRandomResults = () => {
    const randomGender = Math.random() > 0.5 ? "Boy" : "Woman"
    const randomCompliment = COMPLIMENTS[Math.floor(Math.random() * COMPLIMENTS.length)]
    const randomAge = Math.floor(Math.random() * 100) + 5
    const randomIQ = Math.floor(Math.random() * 800) + 200
    const randomMood = MOODS[Math.floor(Math.random() * MOODS.length)]
    const isMonkey = Math.random() < 0.1 // 10% chance for monkey mode

    setGender(randomGender)
    setCompliment(randomCompliment)
    setFakeAge(randomAge)
    setIqScore(randomIQ)
    setMood(randomMood)
    setIsMonkeyMode(isMonkey)
  }

  const getRandomFaceImage = () => {
    // Always show a random human face (not monkey)
    const randomImage = FACE_IMAGES[Math.floor(Math.random() * FACE_IMAGES.length)]
    return `/image/${randomImage}`
  }

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return

    setIsCapturing(true)
    playSound()

    // Stop face detection during capture
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current)
    }

    const canvas = canvasRef.current
    const video = videoRef.current
    const ctx = canvas.getContext("2d")

    if (ctx) {
      // Set canvas size to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Capture the actual video frame (mirrored)
      ctx.save()
      ctx.scale(-1, 1) // Mirror the image
      ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height)
      ctx.restore()

      // Get the captured image data
      const imageData = canvas.toDataURL("image/jpeg", 0.9)
      setCapturedImageData(imageData)
    }

    // Generate random results
    generateRandomResults()

    // Set random face image
    const randomImg = getRandomFaceImage()
    setRandomFaceImage(randomImg)

    // Show results with smooth transition
    setTimeout(() => {
      setIsCapturing(false)
      setShowResults(true)
    }, 800)
  }

  const retake = () => {
    setShowResults(false)
    setCapturedImageData(null)
    setRandomFaceImage(null)
    setGender(null)
    setCompliment("")
    setFakeAge(null)
    setIqScore(null)
    setMood(null)
    setIsMonkeyMode(false)
    setFaceDetected(false)

    // Restart face detection after a brief delay
    setTimeout(() => {
      if (isModelLoaded && stream) {
        detectionIntervalRef.current = setInterval(detectFace, 100)
      }
    }, 500)
  }

  const downloadResult = () => {
    if (!canvasRef.current || !randomFaceImage) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      canvas.width = 640
      canvas.height = 480
      ctx.drawImage(img, 0, 0, 640, 480)

      // Add text overlay with better styling
      ctx.fillStyle = "#ffffff"
      ctx.strokeStyle = "#000000"
      ctx.lineWidth = 2
      ctx.font = "bold 24px Arial"

      const texts = [
        compliment,
        `Age: ${fakeAge} years old`,
        `IQ: ${iqScore}`,
        mood ? `${mood.emoji} ${mood.text}` : "",
      ].filter(Boolean)

      texts.forEach((text, index) => {
        const y = 50 + index * 35
        ctx.strokeText(text, 20, y)
        ctx.fillText(text, 20, y)
      })

      // Download
      const link = document.createElement("a")
      link.download = "ai-mirror-result.jpg"
      link.href = canvas.toDataURL()
      link.click()
    }
    img.src = randomFaceImage
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white transition-all duration-500">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent mb-4">
            AI Mirror:
          </h1>
          <p className="text-lg text-gray-300">The most advanced selfie experience</p>
          {!isModelLoaded && (
            <div className="mt-4 flex items-center justify-center gap-2 text-cyan-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading AI Face Detection Model...
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4 mb-8">
          <Button
            onClick={() => setIsMuted(!isMuted)}
            variant="outline"
            size="icon"
            className="rounded-full bg-gray-800 border-gray-600 hover:bg-gray-700"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <Button
            onClick={() => setIsDarkMode(!isDarkMode)}
            variant="outline"
            size="icon"
            className="rounded-full bg-gray-800 border-gray-600 hover:bg-gray-700"
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>

        
        <div className="max-w-6xl mx-auto">
          {!showResults ? (
            /* Live Camera View */
            <div className="grid place-items-center">
              <Card className="overflow-hidden bg-gray-800 border-gray-700 max-w-2xl w-full">
                <CardContent className="p-0">
                  <div className="relative">
                    {/* Mirrored Video */}
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-auto transform scale-x-[-1] bg-gray-900"
                      style={{ aspectRatio: "4/3" }}
                    />

                    {/* Face Detection Overlay Canvas */}
                    <canvas
                      ref={overlayCanvasRef}
                      className="absolute top-0 left-0 w-full h-full pointer-events-none transform scale-x-[-1]"
                    />

                    {/* Face Detection Status */}
                    {isModelLoaded && (
                      <div
                        className={`absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-bold transition-all duration-300 ${
                          faceDetected
                            ? "bg-green-500/90 text-white shadow-lg shadow-green-500/25"
                            : "bg-red-500/90 text-white shadow-lg shadow-red-500/25"
                        }`}
                      >
                        {faceDetected ? "✅ FACE LOCKED" : "❌ SCANNING..."}
                      </div>
                    )}

                    {/* Flash effect removed to prevent camera flickering */}
                  </div>

                  <div className="p-6">
                    <Button
                      onClick={capturePhoto}
                      disabled={!isModelLoaded || isCapturing}
                      className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 disabled:opacity-50 text-lg py-3"
                      size="lg"
                    >
                      <Camera className="mr-2 h-5 w-5" />
                      {isCapturing ? "Capturing..." : isModelLoaded ? "Capture Photo" : "Loading AI..."}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Results View */
            <div className="grid gap-8 animate-in fade-in duration-700">
              {/* AI Analysis Results Only */}
              <Card className="overflow-hidden bg-gray-800 border-gray-700">
                <CardContent className="p-0">
                  <div className="bg-gray-700 p-3 text-center relative">
                    <h3 className="text-lg font-semibold text-purple-400">AI Analysis Result</h3>
                    {isMonkeyMode && (
                      <div className="absolute top-2 right-2 bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold animate-bounce">
                        🐵 MONKEY MODE!
                      </div>
                    )}
                  </div>

                  {randomFaceImage && (
                    <div className="relative">
                      <img
                        src={randomFaceImage}
                        alt="AI analyzed face"
                        className="w-full h-auto"
                        onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = "/placeholder.svg"; }}
                      />
                    </div>
                  )}

                  <div className="p-6 space-y-4">
                    {gender && (
                      <div className="text-center">
                        <span className="inline-block bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                          {gender}
                        </span>
                      </div>
                    )}

                    <div className="text-center space-y-3">
                      <h3 className="text-2xl font-bold text-cyan-400">{compliment}</h3>

                      <div className="grid grid-cols-1 gap-2 text-gray-300">
                        {fakeAge && (
                          <p className="text-lg">
                            Age: <strong className="text-white">{fakeAge}</strong> years old
                          </p>
                        )}

                        {iqScore && (
                          <p className="text-lg">
                            IQ: <strong className="text-white">{iqScore}</strong> 🧠
                          </p>
                        )}

                        {mood && (
                          <p className="text-lg">
                            Mood:{" "}
                            <strong className="text-white">
                              {mood.emoji} {mood.text}
                            </strong>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={retake}
                        variant="outline"
                        className="flex-1 bg-gray-700 border-gray-600 hover:bg-gray-600"
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Retake
                      </Button>
                      <Button
                        onClick={downloadResult}
                        className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Save
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Hidden elements */}
        <canvas ref={canvasRef} className="hidden" />
        <audio ref={audioRef} preload="auto">
          <source src="/sounds/camera-shutter.mp3" type="audio/mpeg" />
          <source src="/sounds/camera-shutter.wav" type="audio/wav" />
        </audio>
      </div>
    </div>
  )
}
