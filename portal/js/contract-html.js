/* contract-html.js — Returns the full bilingual PDF contract as an HTML string. */
function contractHTML(agentName, signDate) {
  const s = {
    page:    'font-family:"Noto Sans TC","Space Grotesk",sans-serif;padding:36px 40px;max-width:780px;margin:0 auto;color:#111;background:#fff;font-size:11.5px;line-height:1.75;',
    header:  'text-align:center;padding-bottom:20px;margin-bottom:24px;border-bottom:2.5px solid #0D9488;',
    logo:    'font-size:26px;font-weight:700;color:#0D9488;letter-spacing:0.02em;margin-bottom:6px;',
    title:   'font-size:15px;font-weight:700;letter-spacing:0.06em;margin:0;',
    subtitle:'font-size:12.5px;color:#444;margin-top:3px;',
    meta:    'width:100%;border-collapse:collapse;margin-bottom:22px;background:#f7fafa;border:1px solid #d0e8e5;border-radius:6px;',
    metaTd:  'padding:8px 14px;font-size:11.5px;',
    metaLbl: 'color:#555;width:44%;',
    metaVal: 'font-weight:700;color:#0D9488;',
    h2:      'font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#0D9488;margin:20px 0 4px;border-top:1px solid #e5e7eb;padding-top:14px;',
    p:       'margin:4px 0 8px;',
    zh:      'color:#444;margin:2px 0 10px;',
    sig:     'margin-top:30px;border-top:2px solid #111;padding-top:20px;',
    sigLine: 'display:inline-block;border-bottom:1px solid #111;width:260px;margin:0 8px;',
    sigGrid: 'display:flex;gap:40px;margin-top:16px;flex-wrap:wrap;',
    sigItem: 'flex:1;min-width:200px;',
    sigLbl:  'font-size:10px;color:#666;margin-top:4px;',
    footer:  'margin-top:28px;padding-top:14px;border-top:1px solid #e5e7eb;font-size:10px;color:#888;text-align:center;',
  };

  return `<div style="${s.page}">

  <!-- Header -->
  <div style="${s.header}">
    <div style="${s.logo}">Web人</div>
    <p style="${s.title}">AGENT REFERRAL AGREEMENT</p>
    <p style="${s.subtitle}">代理人推薦協議</p>
  </div>

  <!-- Meta -->
  <table style="${s.meta}">
    <tr>
      <td style="${s.metaTd}${s.metaLbl}">Agent Name / 代理人姓名</td>
      <td style="${s.metaTd}${s.metaVal}">${agentName}</td>
    </tr>
    <tr>
      <td style="${s.metaTd}${s.metaLbl}">Date of Acceptance / 簽署日期</td>
      <td style="${s.metaTd}${s.metaVal}">${signDate}</td>
    </tr>
    <tr>
      <td style="${s.metaTd}${s.metaLbl}">Parties / 雙方</td>
      <td style="${s.metaTd}">Aaron (Web人) ("Company") &amp; ${agentName} ("Agent")</td>
    </tr>
  </table>

  <!-- Section 1 -->
  <p style="${s.h2}">1. Commission &amp; Refunds / 佣金與退款</p>
  <p style="${s.p}"><strong>Rate / 費率:</strong> You will receive 15% of the net monthly subscription fee received (excluding VAT/Sales tax and third-party payment processing fees) for each active client you refer.</p>
  <p style="${s.zh}">推薦每一位有效客戶，您將獲得實際收訖淨額之 15%（不含營業稅及第三方支付手續費）作為佣金。</p>
  <p style="${s.p}"><strong>Clawback / 退款扣除:</strong> If a client receives a refund or files a chargeback, any commission paid for that transaction will be deducted from your future earnings.</p>
  <p style="${s.zh}">若客戶獲得退款或發生信用卡退款爭議，該交易所支付之佣金將從您後續之佣金中扣除。</p>
  <p style="${s.p}"><strong>Minimum Payout / 最低付款:</strong> Commissions will be disbursed once your earned balance reaches NT$1,000 TWD.</p>
  <p style="${s.zh}">佣金累計達到 1,000 TWD 後方予發放。</p>
  <p style="${s.p}"><strong>Timeline / 付款時間:</strong> Payment is made within 7 days after the client's subscription is successfully renewed and funds are cleared.</p>
  <p style="${s.zh}">於客戶成功續約且款項入帳後 7 日內支付。</p>

  <!-- Section 2 -->
  <p style="${s.h2}">2. Independent Contractor Status / 獨立承攬人地位</p>
  <p style="${s.p}"><strong>No Employment / 非雇傭關係:</strong> This is a "Contract for Hire" (承攬契約). You are NOT an employee, partner, or joint venture of the Company. You are responsible for your own taxes, Labor Insurance, and Health Insurance.</p>
  <p style="${s.zh}">本協議屬承攬關係而非雇傭關係。您非本公司之員工、合夥人或合資對象。您須自行負擔相關稅務、勞保及健保。</p>
  <p style="${s.p}"><strong>No Authority / 無代理權:</strong> You have no authority to sign contracts, make legal promises, or offer custom discounts on behalf of Aaron (Web人).</p>
  <p style="${s.zh}">您無權代表 Aaron (Web人) 簽署契約、做出任何法律承諾或提供客製化折扣。</p>

  <!-- Section 3 -->
  <p style="${s.h2}">3. Conduct &amp; Brand Protection / 行為準則與品牌保護</p>
  <p style="${s.p}"><strong>Brand Usage / 品牌使用:</strong> You may use the "Web人" name and logo for marketing purposes only in accordance with our guidelines.</p>
  <p style="${s.zh}">您得依本公司規範於行銷活動中使用「Web人」品牌名稱與標誌。</p>
  <p style="${s.p}"><strong>No Spam / 禁止垃圾郵件:</strong> No unsolicited messaging or deceptive marketing. Breach results in immediate termination and forfeiture of unpaid commissions.</p>
  <p style="${s.zh}">嚴禁發送垃圾郵件或進行欺騙性行銷。違者將立即終止協議，且未領取之佣金將予沒收。</p>
  <p style="${s.p}"><strong>Non-Solicitation / 禁止挖角:</strong> You shall not solicit other agents or clients of the Company to move to a competing service during this agreement and for 1 year post-termination.</p>
  <p style="${s.zh}">於本協議期間及終止後一年內，您不得誘導本公司之其他代理人或客戶轉向競爭對手。</p>

  <!-- Section 4 -->
  <p style="${s.h2}">4. Confidentiality / 保密義務</p>
  <p style="${s.p}">You agree not to disclose "Web人" internal business information, including pricing structures, client lists, or business strategies to any third party.</p>
  <p style="${s.zh}">您同意不向第三方洩露「Web人」之內部商業資訊，包含定價結構、客戶名單或商業策略。</p>

  <!-- Section 5 -->
  <p style="${s.h2}">5. Liability &amp; Indemnity / 責任與賠償</p>
  <p style="${s.p}"><strong>Service Liability / 服務責任:</strong> Aaron (Web人) is solely liable for the technical delivery of services to the client.</p>
  <p style="${s.zh}">Aaron (Web人) 僅對提供予客戶之技術服務負責。</p>
  <p style="${s.p}"><strong>Indemnity / 賠償:</strong> You agree to indemnify Aaron (Web人) for any legal costs or damages arising directly from your marketing actions or misrepresentations.</p>
  <p style="${s.zh}">若因您的行銷行為或錯誤陳述導致本公司受損，您同意賠償本公司之法律費用及損失。</p>

  <!-- Section 6 -->
  <p style="${s.h2}">6. Termination / 協議終止</p>
  <p style="${s.p}"><strong>For Convenience / 無故終止:</strong> Either party may terminate this agreement at any time with 30 days' notice. Upon termination for convenience, commissions for active clients will continue to be paid for 3 months post-termination.</p>
  <p style="${s.zh}">雙方均得隨時於 30 日前通知終止本協議。若為無故終止，現有活躍客戶之佣金將繼續發放至終止後 3 個月。</p>
  <p style="${s.p}"><strong>For Cause / 違約終止:</strong> Fraud, spamming, or breach of confidentiality will result in immediate termination of this agreement and cancellation of all pending and future payments.</p>
  <p style="${s.zh}">若有詐欺、發送垃圾郵件或洩密等違約行為，將立即終止本協議並取消所有未付及未來之款項。</p>

  <!-- Section 7 -->
  <p style="${s.h2}">7. Governing Law / 準據法</p>
  <p style="${s.p}">This agreement is governed by the laws of Taiwan (R.O.C.) and complies with the Electronic Signatures Act. Any disputes shall be resolved exclusively in the Taipei District Court.</p>
  <p style="${s.zh}">本協議受中華民國（台灣）法律管轄，並符合《電子簽章法》之規定。如生爭議，合意以台灣台北地方法院為第一審管轄法院。</p>

  <!-- Section 8 -->
  <p style="${s.h2}">8. Electronic Acceptance &amp; Signature / 電子簽署確認</p>
  <p style="${s.p}">By registering and downloading this contract, you acknowledge and legally confirm that:</p>
  <ul style="margin:4px 0 8px;padding-left:20px;">
    <li>You are at least 18 years of age and have the legal capacity to enter into this agreement.</li>
    <li>You have read, understood, and agree to all the terms and conditions outlined above.</li>
    <li>Your digital action constitutes a binding legal signature equivalent to a hand-written signature.</li>
  </ul>
  <p style="${s.zh}">透過註冊並下載本合約，您承認並具有法律效力地確認：</p>
  <ul style="margin:2px 0 10px;padding-left:20px;color:#444;">
    <li>您已滿 18 歲，且具備簽署本協議之完全法律行為能力。</li>
    <li>您已閱讀、理解並同意上述所有條款與條件。</li>
    <li>您的電子操作構成具法律約束力之簽署，等同於手寫簽名。</li>
  </ul>

  <!-- Signature Block -->
  <div style="${s.sig}">
    <p style="font-weight:700;margin-bottom:12px;">Signatures / 簽署</p>
    <div style="${s.sigGrid}">
      <div style="${s.sigItem}">
        <div><span style="${s.sigLine}">${agentName}</span></div>
        <div style="${s.sigLbl}">Agent Signature / 代理人簽署（電子）</div>
      </div>
      <div style="${s.sigItem}">
        <div><span style="${s.sigLine}">${signDate}</span></div>
        <div style="${s.sigLbl}">Date of Acceptance / 簽署日期</div>
      </div>
    </div>
    <div style="${s.sigGrid};margin-top:20px;">
      <div style="${s.sigItem}">
        <div><span style="${s.sigLine}">Aaron</span></div>
        <div style="${s.sigLbl}">Company Representative / 公司代表 (Web人)</div>
      </div>
    </div>
  </div>

  <div style="${s.footer}">
    Web人 &nbsp;·&nbsp; Agent Referral Agreement &nbsp;·&nbsp; Governed by the laws of Taiwan (R.O.C.)
  </div>

</div>`;
}
