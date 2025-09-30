export default function Header(){
  return (
    <header className="p-4 bg-white border-b sticky top-0 z-10">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <h1 className="text-xl font-semibold">StudyBuddy</h1>
        <a className="text-sm text-blue-600" href="https://platform.openai.com/" target="_blank">Powered by OpenAI</a>
      </div>
    </header>
  );
}
