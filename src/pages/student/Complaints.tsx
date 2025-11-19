import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Complaints = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to tracking page as the main complaints view
    navigate("/student/complaints/track", { replace: true });
  }, [navigate]);

  return null;
};

export default Complaints;
