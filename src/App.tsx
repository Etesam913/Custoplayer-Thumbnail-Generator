import { useRef, useState } from "react";
import "./App.css";

async function waitUntil(condition: boolean, callback: () => void) {
  return await new Promise((resolve) => {
    const interval = setInterval(() => {
      if (condition) {
        callback();
        clearInterval(interval);
        resolve("done");
      }
    }, 200);
  });
}

function App() {
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState("");
  const [thumbnailImageUrls, setThumbnailImageUrls] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [thumbnailCount, setThumbnailCount] = useState(50);
  const [currentThumbnailIndex, setCurrentThumbnailIndex] = useState(0);
  const [timeBetweenFrames, setTimeBetweenFrames] = useState(0);
  const [canvasElem, setCanvasElem] = useState<HTMLCanvasElement | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files) {
      const fileObj = files[0];

      const videoUrl = URL.createObjectURL(fileObj);
      console.log(videoUrl);
      setUploadedVideoUrl(videoUrl);
    }
  }

  function handleThumbnailGeneration() {
    if (videoRef && videoRef.current) {
      const canvas = document.createElement("canvas");
      const thumbnailWidth = 125;
      const videoHeight = videoRef.current.clientHeight;
      const thumbnailHeight =
        (thumbnailWidth / videoRef.current.clientWidth) * videoHeight;

      canvas.width = thumbnailWidth;
      canvas.height = thumbnailHeight;
      const calculatedTimeBetweenFrames =
        videoRef.current.duration / thumbnailCount;
      setTimeBetweenFrames(calculatedTimeBetweenFrames);
      videoRef.current.currentTime = calculatedTimeBetweenFrames;
      setCanvasElem(canvas);
    }
  }

  function handleVideoSeek() {
    if (
      currentThumbnailIndex > thumbnailCount ||
      !canvasElem ||
      !videoRef ||
      !videoRef.current
    )
      return;
    const ctx = canvasElem.getContext("2d");
    ctx?.drawImage(videoRef.current, 0, 0, canvasElem.width, canvasElem.height);
    const dataUrl = canvasElem.toDataURL("image/jpeg", 0.7);
    setThumbnailImageUrls((prev) => [...prev, dataUrl]);
    setCurrentThumbnailIndex((prev) => prev + 1);
    videoRef.current.currentTime += timeBetweenFrames;
  }

  return (
    <main>
      <h2>Upload a file</h2>
      <input
        accept='video/mp4, video/mp3, video/m4v, video/mov'
        type='file'
        onChange={handleFileChange}
      />
      {uploadedVideoUrl.length > 0 && (
        <>
          <video
            ref={videoRef}
            width='100%'
            src={uploadedVideoUrl}
            onSeeked={handleVideoSeek}
          />

          <label htmlFor='thumbnail-count'>
            Number of Thumbnails to Generate:
          </label>

          <input
            onChange={(e) => setThumbnailCount(parseInt(e.target.value))}
            id='thumbnail-count'
            type='number'
            min={10}
            max={200}
            defaultValue={50}
          />

          <button
            className='generate-button'
            onClick={handleThumbnailGeneration}
          >
            Generate Thumbnails
          </button>
          <div className='thumbnail-grid'>
            {thumbnailImageUrls.map((url) => {
              return <img src={url} />;
            })}
          </div>
        </>
      )}
    </main>
  );
}

export default App;
