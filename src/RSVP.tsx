import {useState} from "react";
import {Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader} from "@heroui/react";

interface RSVPProps {
  event: {
    title: string;
    description: string;
    location: string;
    sDate: string;
    creatorEmail: string;
  };
}

export default function RSVP({ event }: RSVPProps) {
  const [rsvpResponse, setRsvpResponse] = useState<"Yes" | "No" | "Maybe" | null>(null);
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [showRsvpModal, setShowRsvpModal] = useState(false);
  const [pendingResponse, setPendingResponse] = useState<"Yes" | "No" | "Maybe" | null>(null);
  const [userName, setUserName] = useState("");

  const handleRsvpClick = (response: "Yes" | "No" | "Maybe") => {
    setPendingResponse(response);
    setShowRsvpModal(true);
  };

  const handleRsvpSubmit = () => {
    if (!pendingResponse || !event.creatorEmail) return;

    const name = userName.trim() || "Someone";
    const responseText = pendingResponse;
    
    // Create mailto link
    const subject = `RSVP: ${responseText} - ${event.title}`;
    const body = `Hi,

${name} is responding to your event: "${event.title}"

Response: ${responseText}

Event Details:
${event.description ? `Description: ${event.description}` : ''}
${event.location ? `Location: ${event.location}` : ''}
${event.sDate ? `Date: ${event.sDate}` : ''}

Best regards,
${name}`;

    // Open mailto link
    window.location.href = `mailto:${event.creatorEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    // Close modal and mark as submitted
    setShowRsvpModal(false);
    setRsvpResponse(pendingResponse);
    setRsvpSubmitted(true);
    setUserName("");
    setPendingResponse(null);
  };

  const handleRsvpCancel = () => {
    setShowRsvpModal(false);
    setPendingResponse(null);
    setUserName("");
  };

  if (!event.creatorEmail) {
    return null;
  }

  return (
    <>
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="font-semibold text-gray-800 mb-3">Will you attend this event?</div>
        <div className="text-sm text-gray-600 mb-4">
          Let the organizer know if you'll be coming
        </div>
        {!rsvpSubmitted ? (
          <div className="flex gap-2">
            <Button
              onPress={() => handleRsvpClick("Yes")}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-3 rounded transition-colors"
            >
              Yes
            </Button>
            <Button
              onPress={() => handleRsvpClick("Maybe")}
              className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium py-2 px-3 rounded transition-colors"
            >
              Maybe
            </Button>
            <Button
              onPress={() => handleRsvpClick("No")}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-3 rounded transition-colors"
            >
              No
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-green-600 font-medium mb-2">
              ✓ RSVP submitted: {rsvpResponse}
            </div>
            <Button
              onPress={() => {
                setRsvpSubmitted(false);
                setRsvpResponse(null);
              }}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Change response
            </Button>
          </div>
        )}
      </div>


    <Modal
        isOpen={showRsvpModal}
        onOpenChange={handleRsvpCancel}
    >
        <ModalContent>
            <ModalHeader className="flex flex-col gap-1">RSVP to Event</ModalHeader>
            <ModalBody>
                <p className="text-sm text-gray-600">
                    Your response: <span className="font-medium">{pendingResponse}</span>
                </p>
                <Input
                    placeholder="Your name (optional)"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full"
                />
                <p className="text-xs text-gray-500">
                    If left empty, we'll use "Someone" in the email
                </p>
            </ModalBody>
            <ModalFooter>
                <Button color="primary" onPress={handleRsvpSubmit}>
                    Send email
                </Button>
            </ModalFooter>
        </ModalContent>
    </Modal>

      {/*/!* RSVP Modal *!/*/}
      {/*  <Modal isOpen={showRsvpModal} onClose={handleRsvpCancel}>*/}
      {/*      <ModalHeader className="flex flex-col gap-1">RSVP to Event</ModalHeader>*/}
      {/*      <ModalBody>*/}
      {/*          <div className="mb-4">*/}
      {/*              <p className="text-sm text-gray-600 mb-2">*/}
      {/*                  Your response: <span className="font-medium">{pendingResponse}</span>*/}
      {/*              </p>*/}
      {/*              <Input*/}
      {/*                  placeholder="Your name (optional)"*/}
      {/*                  value={userName}*/}
      {/*                  onChange={(e) => setUserName(e.target.value)}*/}
      {/*                  className="w-full"*/}
      {/*              />*/}
      {/*              <p className="text-xs text-gray-500 mt-1">*/}
      {/*                  If left empty, we'll use "Someone" in the email*/}
      {/*              </p>*/}
      {/*          </div>*/}
      {/*      </ModalBody>*/}
      {/*      <ModalFooter>*/}
      {/*          <Button*/}
      {/*              color="primary"*/}
      {/*              onPress={handleRsvpSubmit}*/}
      {/*              className="flex-1"*/}
      {/*          >*/}
      {/*              Send Email*/}
      {/*          </Button>*/}
      {/*      </ModalFooter>*/}
      {/*  </Modal>*/}
    </>
  );
}
