import { useEffect } from 'react';

const ChatBot = () => {
  useEffect(() => {
    
    // Load Voiceflow script
    const script = document.createElement('script');
    script.src = "https://cdn.voiceflow.com/widget-next/bundle.mjs";
    script.type = "text/javascript";
    script.async = true;
    
    script.onload = () => {
      if (window.voiceflow?.chat) {
        window.voiceflow.chat.load({
          verify: { projectID: '68202d1c6c9c534714a6b660' },
          url: 'https://general-runtime.voiceflow.com',
          versionID: 'production',
          voice: {
            url: "https://runtime-api.voiceflow.com"
          }
        });
        // console.log('Voiceflow chat initialized');
      } else {
        console.error('Voiceflow chat not available after script load');
      }
    };

    script.onerror = (error) => {
      console.error('Error loading Voiceflow script:', error);
    };

    document.body.appendChild(script);

    // Cleanup function
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return null; // This component doesn't render anything visible
};

export default ChatBot; 