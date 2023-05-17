import { useRef, useState } from "react";
import "./App.css";
import { saveAs } from "file-saver";
import Vtt from "vtt-creator";

const thumbnailWidth = 125;
let thumbnailHeight = 0;
const thumbnailsPerRow = 10;
function App() {
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState("");
  const [thumbnailImageUrls, setThumbnailImageUrls] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [thumbnailCount, setThumbnailCount] = useState(50);
  const [currentThumbnailIndex, setCurrentThumbnailIndex] = useState(0);
  const [timeBetweenFrames, setTimeBetweenFrames] = useState(0);
  const [canvasElem, setCanvasElem] = useState<HTMLCanvasElement | null>(null);
  const [vttConstructor, setVttConstructor] = useState<Vtt | null>(null);

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
    const v = new Vtt();
    setVttConstructor(v);
  
    if (videoRef && videoRef.current) {
      const canvas = document.createElement("canvas");

      const videoHeight = videoRef.current.clientHeight;
      thumbnailHeight = Math.floor(
        (thumbnailWidth / videoRef.current.clientWidth) * videoHeight
      );

      canvas.width = thumbnailWidth * thumbnailsPerRow;

      canvas.height =
        Math.ceil(thumbnailCount / thumbnailsPerRow) * thumbnailHeight;

      const calculatedTimeBetweenFrames =
        videoRef.current.duration / thumbnailCount;
      setTimeBetweenFrames(calculatedTimeBetweenFrames);
      videoRef.current.currentTime = calculatedTimeBetweenFrames;
      setCanvasElem(canvas);
    }
  }

  function handleVideoSeek() {
    if (!canvasElem || !videoRef || !videoRef.current) return;
    if (currentThumbnailIndex > thumbnailCount) {
      const dataUrl = canvasElem.toDataURL("image/jpeg", 0.7);
      setThumbnailImageUrls((prev) => [...prev, dataUrl]);
      saveAs(dataUrl, "thumbs.jpg");

      const thumbsBlob = new Blob([vttConstructor.toString()], {
        type: "text/plain;charset=utf-8",
      });
      saveAs(thumbsBlob, "thumbs.vtt");
      console.log(vttConstructor.toString());
      return;
    }

    const prevTime = videoRef.current.currentTime - timeBetweenFrames;

    const ctx = canvasElem.getContext("2d");
    const rowIndex = Math.floor(currentThumbnailIndex / 10);
    const columnIndex = currentThumbnailIndex % 10;
    ctx?.drawImage(
      videoRef.current,
      columnIndex * thumbnailWidth,
      rowIndex * thumbnailHeight,
      thumbnailWidth,
      thumbnailHeight
    );
    vttConstructor?.add(
      prevTime,
      videoRef.current.currentTime,
      `thumbs.jpg#xywh=${rowIndex * thumbnailHeight},${
        columnIndex * thumbnailWidth
      },${thumbnailWidth},${thumbnailHeight}`
    );
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
