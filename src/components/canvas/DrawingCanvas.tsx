import React, { useRef, useEffect, useState, useCallback } from 'react';
import { socket } from '../../lib/socket';
import { useGameStore } from '../../store/gameStore';

interface Point {
  x: number;
  y: number;
}

interface DrawEvent {
  tool: string;
  color: string;
  size: number;
  points: Point[];
}

export function DrawingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  
  const { currentPlayer, roomState } = useGameStore();
  
  // Drawing state
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(5);
  const [tool, setTool] = useState('brush'); // brush, eraser

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setContext(ctx);

    // Handle resize
    const handleResize = () => {
      if (containerRef.current && canvas) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        // Save current content
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        canvas.width = width;
        canvas.height = height;
        
        // Restore context settings after resize
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Ideally we would redraw everything or scale the image, 
        // but for now let's just clear or keep it simple.
        // A better approach is to have a fixed internal resolution and scale via CSS.
        // Let's try fixed resolution for game consistency: 800x600
      }
    };

    // Set initial size
    canvas.width = 800;
    canvas.height = 600;

    // Listen for remote draw events
    const handleRemoteDraw = (data: DrawEvent) => {
      if (!ctx) return;
      
      ctx.beginPath();
      ctx.strokeStyle = data.tool === 'eraser' ? '#FFFFFF' : data.color;
      ctx.lineWidth = data.size;
      
      if (data.points.length > 0) {
        ctx.moveTo(data.points[0].x, data.points[0].y);
        for (let i = 1; i < data.points.length; i++) {
          ctx.lineTo(data.points[i].x, data.points[i].y);
        }
        ctx.stroke();
      }
    };

    const handleClear = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    socket.on('draw:points', handleRemoteDraw);
    socket.on('draw:clear', handleClear);

    return () => {
      socket.off('draw:points', handleRemoteDraw);
      socket.off('draw:clear', handleClear);
    };
  }, []);

  const getCoordinates = (event: React.MouseEvent | React.TouchEvent): Point | null => {
    if (!canvasRef.current) return null;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    
    if ('touches' in event) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = (event as React.MouseEvent).clientX;
      clientY = (event as React.MouseEvent).clientY;
    }

    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const [lastPoint, setLastPoint] = useState<Point | null>(null);

  // ...

  const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
    // Only current drawer can draw
    if (currentPlayer?.id !== roomState?.currentDrawerId) return;
    
    const point = getCoordinates(event);
    if (!point || !context) return;

    setIsDrawing(true);
    setLastPoint(point);
    
    // Draw a dot
    context.beginPath();
    context.arc(point.x, point.y, size / 2, 0, Math.PI * 2);
    context.fillStyle = tool === 'eraser' ? '#FFFFFF' : color;
    context.fill();

    socket.emit('draw:points', {
      tool,
      color,
      size,
      points: [point, point] // Draw a dot remotely
    });
  };

  const draw = (event: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !context || !lastPoint) return;
    
    const point = getCoordinates(event);
    if (!point) return;

    context.beginPath();
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.moveTo(lastPoint.x, lastPoint.y);
    context.lineTo(point.x, point.y);
    context.strokeStyle = tool === 'eraser' ? '#FFFFFF' : color;
    context.lineWidth = size;
    context.stroke();

    socket.emit('draw:points', {
      tool,
      color,
      size,
      points: [lastPoint, point]
    });
    
    setLastPoint(point);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setLastPoint(null);
    socket.emit('draw:end', {});
  };

  const isDrawer = currentPlayer?.id === roomState?.currentDrawerId;

  return (
    <div ref={containerRef} className={`relative w-full aspect-[4/3] bg-white rounded-xl overflow-hidden shadow-2xl ${isDrawer ? 'cursor-crosshair' : 'cursor-default'}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full touch-none"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      
      {/* Toolbar - Only show for drawer */}
      {isDrawer && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-md p-2 rounded-full flex gap-2">
          <button 
            onClick={() => { setTool('brush'); setColor('#000000'); }}
            className={`w-8 h-8 rounded-full bg-black border-2 ${tool === 'brush' && color === '#000000' ? 'border-cyan-400' : 'border-white/20'}`}
          />
          <button 
            onClick={() => { setTool('brush'); setColor('#FF0000'); }}
            className={`w-8 h-8 rounded-full bg-red-500 border-2 ${tool === 'brush' && color === '#FF0000' ? 'border-cyan-400' : 'border-white/20'}`}
          />
          <button 
            onClick={() => { setTool('brush'); setColor('#00FF00'); }}
            className={`w-8 h-8 rounded-full bg-green-500 border-2 ${tool === 'brush' && color === '#00FF00' ? 'border-cyan-400' : 'border-white/20'}`}
          />
          <button 
            onClick={() => { setTool('brush'); setColor('#0000FF'); }}
            className={`w-8 h-8 rounded-full bg-blue-500 border-2 ${tool === 'brush' && color === '#0000FF' ? 'border-cyan-400' : 'border-white/20'}`}
          />
          <div className="w-px h-8 bg-white/20 mx-1" />
          <button 
            onClick={() => setTool('eraser')}
            className={`px-3 py-1 rounded-full text-xs font-bold ${tool === 'eraser' ? 'bg-white text-black' : 'bg-white/10 text-white'}`}
          >
            Eraser
          </button>
          <button 
            onClick={() => {
              if (context && canvasRef.current) {
                context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                socket.emit('draw:clear', {});
              }
            }}
            className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
