export default function LoadingDots(){
  return <span className="inline-flex gap-1 pl-2">
    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
  </span>
}
