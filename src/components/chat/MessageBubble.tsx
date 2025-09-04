import Image from "next/image";
import { ChatMessage } from "@/types"; // Assuming ChatMessage is defined in types/index.ts

interface MessageBubbleProps {
  message: ChatMessage;
}

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isUser = message.role === "user";

  const avatarSrc = isUser
    ? "https://lh3.googleusercontent.com/aida-public/AB6AXuAMJrk2HeLy0DEiUusSnTkSm9h4qfs92CXFZLN-v4JvzigTQt9TVObIzQObkQC_OAw4ktpQQwHhCNYt-ZD-g9y3g0xEppsHoa3r3myc6mwxJVa31KJ3Y_7OcFtBM91dfkguSmAoSy15JkGBM7Rqu7c672vRXUj2joBVgz3xQMnooi_6oFgO5LsOGVR9vFVcKMLdJjE0lY62mha4R1wWHWFUEI3SS5ZTLWSVmvxv8wSwYRXaYIjPXIGzkFyDk86I0DPPUaMOA2FjGflRXBYfGwkVoII7QUrgHKAuvJrssPeL7K4HXbOx6lmxCVxMUxy7SN74bjAum8ZNyFG_MWUzM1T5Zf8ENmYkvotmvFw-"
    : "https://lh3.googleusercontent.com/aida-public/AB6AXuCVaWAi5itIjjRD4rSJneRYSpO7PQMd92UYBEPMnPB4dbRtPNDz0juDC5W8GNOIDTmTFr-v3c2-7up880LSq_GR2R2gHgFh-deSSzU1iarbcdugLaESGcqvjMRyapl2TOyOQIBljwtLYi3BXNtR_Vk4_1pCb-Te6yFhcri2d-mI7atWcCffn3S7i0j0tp6Z1ZyVq5yEipZ_GwvlSmnzWHCqS-ojV-6AwhSpAcDVfPtSRbvaJRRo0qXceCbEOK0wlnMOLd5gJqLzdHDJ";

  const bubbleClasses = isUser
    ? "bg-primary-500 rounded-tr-none"
    : "bg-neutral-800 rounded-tl-none";

  const alignmentClasses = isUser ? "justify-end" : "items-start";
  const textAlignmentClasses = isUser ? "items-end" : "items-start";

  return (
    <div className={`flex items-start gap-3 ${alignmentClasses}`}>
      {!isUser && (
        <Image
          alt="AI Assistant Avatar"
          className="size-8 rounded-full"
          src={avatarSrc}
          width={32}
          height={32}
        />
      )}
      <div
        className={`max-w-md rounded-xl px-4 py-3 text-base leading-normal font-normal text-white ${bubbleClasses}`}
      >
        {message.content}
      </div>
      {isUser && (
        <Image
          alt="User Avatar"
          className="size-8 rounded-full"
          src={avatarSrc}
          width={32}
          height={32}
        />
      )}
    </div>
  );
};
