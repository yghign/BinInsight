'use client';

import DefenseSwitcher, { type MitigationRow, type FixOption } from '../DefenseSwitcher';
import TermButton from '../TermButton';
import SourceBadge from '../SourceBadge';

/**
 * L6 加把锁 —— 复用 DefenseSwitcher 的 single 模式：只留 Canary 一个开关。
 * 唯一新概念：防护 = 编译器/系统自动加的检查（Canary = 门口贴的封条）。
 * NX / ASLR 一句话带过；「绕过方法」整块归 L8 拓展区，不在本级出现。
 */

const MITIGATIONS: MitigationRow[] = [
  {
    name: 'Canary',
    defaultOn: false,
    desc: '返回地址前的一张封条，里面是一个随机数。',
    effectOff: '没有封条：溢出数据一路盖到「程序下一步要跳去的地方」，程序崩掉。',
    effectOn: '封条被改动：程序立刻报警停下，不会跳到被改过的地址。',
  },
];

const VULN_CODE = `void vulnerable(char *input) {
    char box[64];
    strcpy(box, input);   // 不检查长度
}`;

const FIX_OPTIONS: FixOption[] = [
  {
    code: '开启 Canary：让编译器自动在返回地址前加一张封条',
    correct: true,
    label: '不用改动这行 strcpy，防护由编译器自动加',
  },
  {
    code: '把 strcpy 换成运行更快的一个函数',
    correct: false,
    label: '换个更快的函数就安全了？',
  },
];

const RECOMMENDED_FIX = {
  code: 'strncpy(box, input, 63); box[63] = 0;   // L3 的限长写法\n// 再叠加编译器自动加的 Canary 封条',
  explanation:
    '两种办法可以同时用：L3 是改你写的那行代码，L6 的 Canary 是编译器自动加的检查。「绕过方法」本级不展开。',
};

export default function L6Canary() {
  return (
    <div className="u-lesson-stage">
      <div className="mb-5">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <SourceBadge state="demo" />
          <span className="u-lesson-note">本屏为模拟对比，非现场运行</span>
        </div>
        <h2 className="u-lesson-section">同一份输入，一次被拦、一次崩掉</h2>
        <p className="u-lesson-body">
          把开关切到「开」再切回「关」，对比右边的运行结果。<TermButton termId="canary" /> 是
          <TermButton termId="protection" /> 的一把锁：<strong className="text-[var(--text)]">返回地址前的一张封条</strong>，
          被溢出的数据改到，程序就立刻报警停下。NX / ASLR 是另外两把自动加的锁，本次一句话带过、不展开。
        </p>
      </div>

      <DefenseSwitcher
        single
        mitigations={MITIGATIONS}
        vulnCode={VULN_CODE}
        fixOptions={FIX_OPTIONS}
        recommendedFix={RECOMMENDED_FIX}
      />

      <p className="u-lesson-note mt-5">
        以上为演示样例：运行结果文本是课前备好的模拟日志，用于对比开关差异，不是现场跑出的结果。
      </p>
    </div>
  );
}
