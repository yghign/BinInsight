import Link from 'next/link';
import {
  ChevronRight,
  GraduationCap,
  Scale,
  ShieldAlert,
  Package,
  Mail,
  AlertTriangle,
} from 'lucide-react';

export const metadata = {
  title: '使用条款 | BinInsight',
  description: 'BinInsight 平台使用条款：教育用途声明、合法使用承诺、免责声明及第三方声明。',
};

const sections = [
  {
    icon: GraduationCap,
    title: '教育用途声明',
    color: 'brand',
    content: [
      'BinInsight（以下简称"本平台"）是一个面向逆向工程与漏洞防护领域的教育学习平台。',
      '本平台提供的所有内容，包括但不限于教学文章、工具软件、案例文件、代码示例，均仅用于教育和研究目的。',
      '我们致力于通过系统化的课程和可复现的实验环境，帮助学习者理解二进制安全原理，掌握漏洞分析与防护技能，从而更好地保护软件系统的安全。',
      '本平台鼓励负责任的安全研究行为，支持在合法授权范围内进行漏洞发现与披露。',
    ],
  },
  {
    icon: Scale,
    title: '合法使用承诺',
    color: 'accent-green',
    content: [
      '使用本平台的工具和案例，您必须遵守以下规定：',
      '1. 仅对您拥有合法权限的软件进行分析、测试和修改。这包括您自己编写的程序、您获得授权的开源软件，以及您所在组织明确授权您进行安全测试的软件。',
      '2. 不得将本平台提供的工具、技术或案例用于任何非法目的，包括但不限于：未经授权入侵他人系统、窃取数据、破坏软件功能、制作或传播恶意软件。',
      '3. 在进行任何安全测试前，请确保您已获得相关方的书面授权，并遵守适用的法律法规。',
      '4. 如您发现真实软件中存在漏洞，请通过负责任的漏洞披露渠道（如厂商安全响应中心、CVE 等）报告，不得公开泄露漏洞细节或用于不当用途。',
      '5. 您使用本平台内容所产生的任何后果，由您自行承担全部责任。',
    ],
  },
  {
    icon: ShieldAlert,
    title: '免责声明',
    color: 'accent-orange',
    content: [
      '本平台按"现状"提供所有内容，不提供任何明示或暗示的保证，包括但不限于适销性、特定用途适用性和非侵权性的保证。',
      '本平台提供的工具软件和案例文件可能包含已知或未知的漏洞，运行这些程序可能导致系统不稳定、数据丢失或其他安全风险。',
      '建议您在隔离的实验环境（如虚拟机、沙箱）中运行案例文件和工具，不要在生产环境或包含重要数据的系统中使用。',
      '在法律允许的最大范围内，本平台及其开发者、贡献者不对任何直接、间接、附带、特殊、后果性或惩罚性损害承担责任。',
      '本平台内容中的所有分析结果、漏洞报告和防护建议仅供参考，不构成任何安全保证或专业建议。',
    ],
  },
  {
    icon: Package,
    title: '第三方工具声明',
    color: 'accent-purple',
    content: [
      '本平台的工具和教学内容依赖或引用了以下第三方开源软件，它们各自拥有独立的开源许可证：',
      '· Ghidra：由美国国家安全局（NSA）开发的软件逆向工程工具，遵循 Apache License 2.0。',
      '· Docker：容器化平台，遵循 Apache License 2.0。',
      '· Prism.js：代码语法高亮库，遵循 MIT License。',
      '· Next.js、React 及相关前端依赖：遵循各自的开源许可证。',
      '· lucide-react：图标库，遵循 ISC License。',
      '本平台对上述第三方工具不拥有所有权，相关权利归各自版权所有者所有。',
      '使用这些第三方工具时，请遵守其各自的许可条款。本平台不对第三方工具的功能、安全性或合法性做出任何保证。',
    ],
  },
  {
    icon: Mail,
    title: '联系方式',
    color: 'accent-cyan',
    content: [
      '如您对本使用条款有任何疑问、建议或需要进一步澄清，或发现任何可能违反本条款的行为，请通过以下方式联系我们：',
      '· 邮箱：legal@bininsight.example.com',
      '· GitHub Issues：github.com/bininsight/bininsight/issues',
      '我们重视每一位用户的反馈，并将在合理时间内回复您的来信。',
    ],
  },
];

export default function TermsPage() {
  const colorMap: Record<string, string> = {
    brand: 'text-brand-400 bg-brand-500/15',
    'accent-green': 'text-accent-green bg-accent-green/15',
    'accent-orange': 'text-accent-orange bg-accent-orange/15',
    'accent-purple': 'text-accent-purple bg-accent-purple/15',
    'accent-cyan': 'text-accent-cyan bg-accent-cyan/15',
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-bg-soft border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <Link href="/" className="hover:text-white transition-colors">
              首页
            </Link>
            <ChevronRight size={14} />
            <span className="text-gray-300">使用条款</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">使用条款</h1>
          <p className="text-gray-400 max-w-2xl">
            使用 BinInsight 平台前请仔细阅读以下条款。使用本平台即表示您同意遵守这些条款。
          </p>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="p-5 bg-accent-orange/10 border border-accent-orange/30 rounded-xl">
          <div className="flex gap-3">
            <AlertTriangle size={22} className="text-accent-orange flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-accent-orange mb-1">重要提示</div>
              <p className="text-sm text-gray-300 leading-relaxed">
                本平台所有内容仅供教育和研究使用。使用本平台的工具和案例时，请确保您拥有合法权限，
                并遵守您所在地区的法律法规。不当使用可能导致法律后果。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="space-y-8">
          {sections.map((section, idx) => {
            const Icon = section.icon;
            return (
              <div
                key={idx}
                className="bg-bg-card border border-border rounded-2xl p-6 md:p-8 scroll-mt-20"
                id={`section-${idx + 1}`}
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colorMap[section.color]}`}>
                    <Icon size={22} />
                  </div>
                  <h2 className="text-xl font-bold">{section.title}</h2>
                </div>
                <div className="space-y-3">
                  {section.content.map((para, pIdx) => (
                    <p key={pIdx} className="text-gray-300 leading-relaxed text-sm md:text-base">
                      {para}
                    </p>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Last updated */}
        <div className="mt-10 text-center text-xs text-gray-500">
          最后更新日期：2024 年 1 月
        </div>
      </div>
    </div>
  );
}
