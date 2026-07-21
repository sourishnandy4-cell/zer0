import { useEffect, useRef, useState } from 'react';

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [opacity, setOpacity] = useState<number>(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let rafId: number;

    const monitorVideo = () => {
      if (video.duration) {
        const cur = video.currentTime;
        const dur = video.duration;
        let nextOpacity = 1;

        if (cur < 0.5) {
          // Fade in over 0.5s at the start
          nextOpacity = cur / 0.5;
        } else if (dur - cur < 0.5) {
          // Fade out over 0.5s before the end
          nextOpacity = Math.max(0, (dur - cur) / 0.5);
        }

        setOpacity(nextOpacity);
      }
      rafId = requestAnimationFrame(monitorVideo);
    };

    const handlePlay = () => {
      rafId = requestAnimationFrame(monitorVideo);
    };

    const handlePause = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };

    const handleEnded = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      setOpacity(0);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current.play().catch(err => {
            console.error("React loop play failed:", err);
          });
        }
      }, 100);
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    // Start video playback
    video.play().catch(err => {
      console.warn("Autoplay was prevented, waiting for user interaction:", err);
    });

    // Initial trigger in case it is already playing
    if (!video.paused) {
      handlePlay();
    }

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white select-none">
      
      {/* Background Video Layer */}
      <div 
        className="absolute z-0 overflow-hidden pointer-events-none w-full"
        style={{ 
          top: '300px', 
          inset: 'auto 0 0 0',
          height: 'calc(100vh - 300px)'
        }}
      >
        <video
          ref={videoRef}
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_083109_283f3553-e28f-428b-a723-d639c617eb2b.mp4"
          muted
          playsInline
          preload="auto"
          className="w-full h-full object-cover transition-opacity duration-75"
          style={{ opacity: opacity }}
        />
        
        {/* Gradient Overlay over Video */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none z-10" />
      </div>

      {/* Navigation Bar */}
      <header className="relative z-10 max-w-7xl mx-auto px-8 py-6 flex justify-between items-center">
        {/* Logo */}
        <div className="font-serif text-3xl tracking-tight text-[#000000]">
          Aethera<sup>®</sup>
        </div>

        {/* Menu Items */}
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#" className="text-sm font-sans text-[#000000] font-medium transition-colors hover:text-black">
            Home
          </a>
          <a href="#" className="text-sm font-sans text-[#6F6F6F] transition-colors hover:text-black">
            Studio
          </a>
          <a href="#" className="text-sm font-sans text-[#6F6F6F] transition-colors hover:text-black">
            About
          </a>
          <a href="#" className="text-sm font-sans text-[#6F6F6F] transition-colors hover:text-black">
            Journal
          </a>
          <a href="#" className="text-sm font-sans text-[#6F6F6F] transition-colors hover:text-black">
            Reach Us
          </a>
        </nav>

        {/* CTA Button */}
        <div>
          <button className="rounded-full px-6 py-2.5 text-sm font-sans font-medium bg-[#000000] text-white transition-all duration-300 hover:scale-103 cursor-pointer">
            Begin Journey
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main 
        className="relative z-10 flex flex-col items-center justify-center text-center px-6"
        style={{ 
          paddingTop: 'calc(8rem - 75px)',
          paddingBottom: '10rem'
        }}
      >
        {/* Headline */}
        <h1 
          className="font-serif text-5xl sm:text-7xl md:text-8xl font-normal max-w-7xl tracking-[-2.46px] leading-[0.95] text-[#000000] animate-fade-rise"
        >
          Beyond <span className="italic text-[#6F6F6F]">silence,</span> we build <span className="italic text-[#6F6F6F]">the eternal.</span>
        </h1>

        {/* Description */}
        <p 
          className="font-sans text-base sm:text-lg text-[#6F6F6F] max-w-2xl mt-8 leading-relaxed animate-fade-rise-delay"
        >
          Building platforms for brilliant minds, fearless makers, and thoughtful souls. 
          Through the noise, we craft digital havens for deep work and pure flows.
        </p>

        {/* Hero CTA Button */}
        <button 
          className="rounded-full px-14 py-5 text-base font-sans font-medium mt-12 bg-[#000000] text-white transition-all duration-300 hover:scale-103 cursor-pointer animate-fade-rise-delay-2"
        >
          Begin Journey
        </button>
      </main>

    </div>
  );
}

export default App;
