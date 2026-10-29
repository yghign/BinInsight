export default function ReferenceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-[1280px] mx-auto px-5 sm:px-8 py-10 md:py-12">{children}</div>
  );
}
