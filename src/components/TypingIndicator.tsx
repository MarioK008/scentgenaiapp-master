const TypingIndicator = () => {
  return (
    <div className="p-4 rounded-xl bg-secondary/50 mr-8 border-l-2 border-accent/50 inline-flex items-center gap-1.5 animate-fade-in">
      <span className="text-xs text-muted-foreground mr-2 uppercase tracking-wide font-medium">
        Assistant
      </span>
      <span className="w-2 h-2 rounded-full bg-accent animate-typing-dot" style={{ animationDelay: "0ms" }} />
      <span className="w-2 h-2 rounded-full bg-accent animate-typing-dot" style={{ animationDelay: "200ms" }} />
      <span className="w-2 h-2 rounded-full bg-accent animate-typing-dot" style={{ animationDelay: "400ms" }} />
    </div>
  );
};

export default TypingIndicator;
