'use client';

import { StatusBar } from "@/components/StatusBar";

export default function MatchPage() {
  const handleEndSession = () => {
	// Logic to handle the end of the session
	console.log("Session ended");
  };
  return (
	<div className="min-h-screen bg-gray-900 text-white">
	  {/* Other match page content */}
	  <StatusBar
		initialTimeRemaining={1500} // Example: 25 minutes
		questionName="Two Sum"
		programmingLanguage="JavaScript"
		difficulty="Easy"
		totalTimeAllocated={30} // Example: 30 minutes
		onEndSession={handleEndSession}
	  />
	</div>
  );
}