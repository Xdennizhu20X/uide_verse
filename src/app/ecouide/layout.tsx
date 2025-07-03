export default function EcoUideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const backgroundImageUrl = 'https://storage.googleapis.com/project-wizard-v2-images/uide-bg.png';
  return (
    <div className="ecouide-theme">
      <div 
        className="fixed inset-0 bg-cover bg-center -z-10"
        style={{ backgroundImage: `url(${backgroundImageUrl})` }}
      />
      <div className="fixed inset-0 bg-background/80 -z-10" />
      <div className="relative">
        {children}
      </div>
    </div>
  );
}
