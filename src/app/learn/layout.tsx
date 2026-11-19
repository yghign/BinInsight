/**
 * 学习区共享布局。
 *
 * 主线 /learn/l0..l7 由 LessonShell 自带「第 N 级 + 8 级路径栏」，
 * 因此这里只保留一层容器，不再叠加旧的四步 header（避免路径重复、信息密度过高）。
 * 旧 /learn/step1..step4 仍为静态路由，归 L8 拓展区并带「课外拓展」横幅，可正常访问。
 */
export default function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div>{children}</div>;
}
