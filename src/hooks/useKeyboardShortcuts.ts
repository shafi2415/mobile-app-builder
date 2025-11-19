import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const useKeyboardShortcuts = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Check if Ctrl (or Cmd on Mac) is pressed
      const isModifier = event.ctrlKey || event.metaKey;

      if (!isModifier) return;

      // Prevent default only if we're handling the shortcut
      switch (event.key.toLowerCase()) {
        case "n":
          event.preventDefault();
          navigate("/student/complaints/new");
          break;
        case "c":
          event.preventDefault();
          navigate("/student/community");
          break;
        case "t":
          event.preventDefault();
          navigate("/student/complaints/track");
          break;
        case "h":
          event.preventDefault();
          navigate("/student/dashboard");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [navigate]);
};
