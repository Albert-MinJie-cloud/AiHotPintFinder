import { useState } from 'react';
import { Mail, ShieldAlert, Save, BellRing, Settings2 } from 'lucide-react';

export function NotificationSettings() {
  const [enabled, setEnabled] = useState(true);

  return (
    <div className="flex flex-col space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-lg font-bold text-slate-800">配置 QQ 邮箱告警通知</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">当监控词检索量突增或上榜时，通过 QQ 邮箱发送实时通知</p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Main Setting Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <BellRing className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">启用邮件告警</h3>
                <p className="text-xs font-medium text-slate-500 mt-0.5">开启后将向指定邮箱发送监控报告</p>
              </div>
            </div>
            <button 
              onClick={() => setEnabled(!enabled)}
              className={`w-12 h-6 rounded-full flex items-center p-1 transition-colors cursor-pointer ${
                enabled ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                enabled ? 'translate-x-6' : 'translate-x-0'
              }`}></div>
            </button>
          </div>

          <div className={`transition-opacity ${enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
            <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400" />
              QQ 邮箱发件配置
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">发件邮箱 (QQ邮箱)</label>
                <input 
                  type="email" 
                  placeholder="例如: 12345678@qq.com" 
                  defaultValue="alert-bot@qq.com"
                  className="w-full bg-slate-50 border border-slate-200 text-sm text-slate-800 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-400 focus:bg-white transition-all font-medium"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                  SMTP 授权码
                  <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded ml-2">必填</span>
                </label>
                <input 
                  type="password" 
                  placeholder="请输入 QQ 邮箱的 SMTP 授权码" 
                  defaultValue="abcdefghijklmnop"
                  className="w-full bg-slate-50 border border-slate-200 text-sm text-slate-800 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-400 focus:bg-white transition-all font-medium font-mono"
                />
                <p className="text-[10px] text-slate-400 font-medium">请在 QQ邮箱 - 设置 - 账号中开启 POP3/SMTP 服务并生成授权码</p>
              </div>
            </div>

            <div className="w-full h-px bg-slate-100 my-6"></div>

            <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-slate-400" />
              接收与规则配置
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">收件人邮箱 (多个以逗号分隔)</label>
                <input 
                  type="text" 
                  placeholder="例如: admin@company.com, team@company.com" 
                  defaultValue="team@company.com"
                  className="w-full bg-slate-50 border border-slate-200 text-sm text-slate-800 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-400 focus:bg-white transition-all font-medium"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">告警触发条件</label>
                <select className="w-full bg-slate-50 border border-slate-200 text-sm text-slate-800 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-400 focus:bg-white transition-all font-medium cursor-pointer">
                  <option>热度指数突破 100万</option>
                  <option>热度指数突破 300万</option>
                  <option>进入平台前十名</option>
                  <option>自定义规则 (高级)</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">告警频率限制</label>
                <select className="w-full bg-slate-50 border border-slate-200 text-sm text-slate-800 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-400 focus:bg-white transition-all font-medium cursor-pointer">
                  <option>每个热点最多通知 1 次</option>
                  <option>每天最多通知 5 次</option>
                  <option>不限制 (有动态即通知)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end gap-3">
          <button className="px-6 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer">
            发送测试邮件
          </button>
          <button className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-sm transition-colors flex items-center gap-2 cursor-pointer">
            <Save className="w-4 h-4" />
            保存配置
          </button>
        </div>
        
        {/* Info Box */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 mt-4">
          <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h5 className="text-sm font-bold text-amber-800">隐私与安全提示</h5>
            <p className="text-xs font-medium text-amber-700/80 mt-1">
              SMTP 授权码仅用于发送通知邮件，系统会对其进行加密存储。请勿将 QQ 邮箱密码作为授权码使用。建议使用专用的小号或公共邮箱作为发件邮箱。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
