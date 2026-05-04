import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "../components/Icon";
import { card } from "../utils/styles";
import API from "../api/api";

// ── Settings API (inlined) ──────────────────────────────────────────────────
const getSettings = () => API.get("/settings/me").then((r) => r.data);
const updateSetting = (updates) => API.put("/settings/me", updates).then((r) => r.data);
// ───────────────────────────────────────────────────────────────────────────

const PRIVACY_POLICY_HTML = `
<style>
  [data-custom-class='body'], [data-custom-class='body'] * {
    background: transparent !important;
  }
  [data-custom-class='title'], [data-custom-class='title'] * {
    font-family: Arial !important;
    font-size: 22px !important;
    color: var(--white) !important;
  }
  [data-custom-class='subtitle'], [data-custom-class='subtitle'] * {
    font-family: Arial !important;
    color: var(--muted) !important;
    font-size: 13px !important;
  }
  [data-custom-class='heading_1'], [data-custom-class='heading_1'] * {
    font-family: Arial !important;
    font-size: 16px !important;
    color: var(--white) !important;
  }
  [data-custom-class='heading_2'], [data-custom-class='heading_2'] * {
    font-family: Arial !important;
    font-size: 14px !important;
    color: var(--white) !important;
  }
  [data-custom-class='body_text'], [data-custom-class='body_text'] * {
    color: var(--body) !important;
    font-size: 13px !important;
    font-family: Arial !important;
  }
  [data-custom-class='link'], [data-custom-class='link'] * {
    color: var(--amber) !important;
    font-size: 13px !important;
    font-family: Arial !important;
    word-break: break-word !important;
  }
  h1 { font-size: 20px !important; color: var(--white) !important; margin: 0 0 8px 0; }
  h2 { font-size: 15px !important; color: var(--white) !important; margin: 16px 0 6px 0; }
  h3 { font-size: 13px !important; color: var(--white) !important; margin: 12px 0 4px 0; }
  ul { list-style-type: square; padding-left: 20px; }
  ul > li > ul { list-style-type: circle; }
  ul > li > ul > li > ul { list-style-type: square; }
  ol li { font-family: Arial; }
  a { color: var(--amber) !important; }
  bdt { display: none; }
</style>
<div data-custom-class="body">
  <div><strong><span style="font-size: 26px;"><span data-custom-class="title"><h1>PRIVACY POLICY</h1></span></span></strong></div>
  <div><span style="color: rgb(127, 127, 127);"><strong><span style="font-size: 15px;"><span data-custom-class="subtitle">Last updated April 20, 2026</span></span></strong></span></div>
  <div><br></div>
  <div style="line-height: 1.5;"><span data-custom-class="body_text">This Privacy Notice for <strong>Intellectaflow LLP</strong> ('we', 'us', or 'our'), describes how and why we might access, collect, store, use, and/or share ('process') your personal information when you use our services ('Services'), including when you:</span></div>
  <ul>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span data-custom-class="body_text">Visit our website at <a target="_blank" href="http://intellectaflow.com">http://intellectaflow.com</a> or any website of ours that links to this Privacy Notice</span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span data-custom-class="body_text">Use <strong>Intellectaflow</strong> — an AI-driven student profiling and teacher insight platform designed to reduce teacher workload and enable personalized learning at scale.</span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span data-custom-class="body_text">Engage with us in other related ways, including any marketing or events</span></li>
  </ul>
  <div style="line-height: 1.5;"><span data-custom-class="body_text"><strong>Questions or concerns?</strong> Reading this Privacy Notice will help you understand your privacy rights and choices. If you do not agree with our policies and practices, please do not use our Services. If you still have any questions or concerns, please contact us at <a target="_blank" href="mailto:info@intellectaflow.com">info@intellectaflow.com</a>.</span></div>
  <div><br></div>

  <div style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>SUMMARY OF KEY POINTS</h2></span></strong></div>
  <div style="line-height: 1.5;"><span data-custom-class="body_text"><strong><em>This summary provides key points from our Privacy Notice.</em></strong></span></div>
  <div><br></div>
  <div style="line-height: 1.5;"><span data-custom-class="body_text"><strong>What personal information do we process?</strong> When you visit, use, or navigate our Services, we may process personal information depending on how you interact with us and the Services, the choices you make, and the products and features you use.</span></div>
  <div><br></div>
  <div style="line-height: 1.5;"><span data-custom-class="body_text"><strong>Do we process any sensitive personal information?</strong> Some information may be considered 'special' or 'sensitive' in certain jurisdictions. We may process sensitive personal information when necessary with your consent or as otherwise permitted by applicable law.</span></div>
  <div><br></div>
  <div style="line-height: 1.5;"><span data-custom-class="body_text"><strong>Do we collect any information from third parties?</strong> We do not collect any information from third parties.</span></div>
  <div><br></div>
  <div style="line-height: 1.5;"><span data-custom-class="body_text"><strong>How do we process your information?</strong> We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law.</span></div>
  <div><br></div>
  <div style="line-height: 1.5;"><span data-custom-class="body_text"><strong>How do we keep your information safe?</strong> We have adequate organisational and technical processes and procedures in place to protect your personal information. However, no electronic transmission over the internet or information storage technology can be guaranteed to be 100% secure.</span></div>
  <div><br></div>

  <div id="toc" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>TABLE OF CONTENTS</h2></span></strong></div>
  <div style="line-height: 1.5;"><a data-custom-class="link" href="#infocollect">1. WHAT INFORMATION DO WE COLLECT?</a></div>
  <div style="line-height: 1.5;"><a data-custom-class="link" href="#infouse">2. HOW DO WE PROCESS YOUR INFORMATION?</a></div>
  <div style="line-height: 1.5;"><a data-custom-class="link" href="#whoshare">3. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</a></div>
  <div style="line-height: 1.5;"><a data-custom-class="link" href="#ai">4. DO WE OFFER ARTIFICIAL INTELLIGENCE-BASED PRODUCTS?</a></div>
  <div style="line-height: 1.5;"><a data-custom-class="link" href="#inforetain">5. HOW LONG DO WE KEEP YOUR INFORMATION?</a></div>
  <div style="line-height: 1.5;"><a data-custom-class="link" href="#infosafe">6. HOW DO WE KEEP YOUR INFORMATION SAFE?</a></div>
  <div style="line-height: 1.5;"><a data-custom-class="link" href="#privacyrights">7. WHAT ARE YOUR PRIVACY RIGHTS?</a></div>
  <div style="line-height: 1.5;"><a data-custom-class="link" href="#DNT">8. CONTROLS FOR DO-NOT-TRACK FEATURES</a></div>
  <div style="line-height: 1.5;"><a data-custom-class="link" href="#policyupdates">9. DO WE MAKE UPDATES TO THIS NOTICE?</a></div>
  <div style="line-height: 1.5;"><a data-custom-class="link" href="#contact">10. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</a></div>
  <div style="line-height: 1.5;"><a data-custom-class="link" href="#request">11. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?</a></div>
  <div><br></div>

  <div id="infocollect" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>1. WHAT INFORMATION DO WE COLLECT?</h2></span></strong>
    <span data-custom-class="heading_2"><strong><h3>Personal information you disclose to us</h3></strong></span>
    <span data-custom-class="body_text"><strong><em>In Short: </em></strong><em>We collect personal information that you provide to us.</em></span>
  </div>
  <div><br></div>
  <div style="line-height: 1.5;"><span data-custom-class="body_text">We collect personal information that you voluntarily provide to us when you register on the Services, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Services, or otherwise when you contact us.</span></div>
  <div><br></div>
  <div style="line-height: 1.5;"><span data-custom-class="body_text"><strong>Personal Information Provided by You.</strong> The personal information we collect may include:</span></div>
  <ul>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span data-custom-class="body_text">names</span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span data-custom-class="body_text">phone numbers</span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span data-custom-class="body_text">email addresses</span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span data-custom-class="body_text">usernames</span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span data-custom-class="body_text">passwords</span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span data-custom-class="body_text">educational data</span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span data-custom-class="body_text">academic data</span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span data-custom-class="body_text">psychological behaviour</span></li>
  </ul>
  <div id="sensitiveinfo" style="line-height: 1.5;"><span data-custom-class="body_text"><strong>Sensitive Information.</strong> When necessary, with your consent or as otherwise permitted by applicable law, we process the following categories of sensitive information:</span></div>
  <ul>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span data-custom-class="body_text">student data</span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span data-custom-class="body_text">behavioural data</span></li>
  </ul>
  <div style="line-height: 1.5;"><span data-custom-class="body_text">All personal information that you provide to us must be true, complete, and accurate, and you must notify us of any changes to such personal information.</span></div>
  <div><br></div>
  <div style="line-height: 1.5;"><span data-custom-class="heading_2"><strong><h3>Information automatically collected</h3></strong></span>
    <span data-custom-class="body_text"><em>Some information — such as your Internet Protocol (IP) address and/or browser and device characteristics — is collected automatically when you visit our Services.</em></span>
  </div>
  <div><br></div>
  <div style="line-height: 1.5;"><span data-custom-class="body_text">We automatically collect certain information when you visit, use, or navigate the Services. This information does not reveal your specific identity but may include device and usage information, such as your IP address, browser and device characteristics, operating system, language preferences, and other technical information.</span></div>
  <div><br></div>
  <div style="line-height: 1.5;"><span data-custom-class="body_text"><strong><h3>Google API</h3></strong>Our use of information received from Google APIs will adhere to <a href="https://developers.google.com/terms/api-services-user-data-policy" rel="noopener noreferrer" target="_blank">Google API Services User Data Policy</a>, including the <a href="https://developers.google.com/terms/api-services-user-data-policy#limited-use" rel="noopener noreferrer" target="_blank">Limited Use requirements</a>.</span></div>
  <div><br></div>

  <div id="infouse" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>2. HOW DO WE PROCESS YOUR INFORMATION?</h2></span></strong>
    <span data-custom-class="body_text"><strong><em>In Short: </em></strong><em>We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law.</em></span>
  </div>
  <div><br></div>
  <div style="line-height: 1.5;"><span data-custom-class="body_text"><strong>We process your personal information for a variety of reasons, including:</strong></span></div>
  <ul>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span data-custom-class="body_text"><strong>To facilitate account creation and authentication and otherwise manage user accounts.</strong></span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span data-custom-class="body_text"><strong>To enable user-to-user communications.</strong> We may process your information if you choose to use any of our offerings that allow for communication with another user.</span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span data-custom-class="body_text"><strong>To evaluate and improve our Services, products, marketing, and your experience.</strong></span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span data-custom-class="body_text"><strong>To identify usage trends.</strong> We may process information about how you use our Services to better understand how they are being used so we can improve them.</span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span data-custom-class="body_text"><strong>Turn insights into clear teaching decisions.</strong> Our platform converts student data into actionable insights that enable teachers to make clear, informed teaching decisions.</span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span data-custom-class="body_text"><strong>Use data to adapt learning per student.</strong> Our platform uses student performance and interaction data to personalize learning for each student.</span></li>
  </ul>
  <div><br></div>

  <div id="whoshare" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>3. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</h2></span></strong>
    <span data-custom-class="body_text"><strong><em>In Short:</em></strong><em> We may share information in specific situations described in this section and/or with the following third parties.</em></span>
  </div>
  <div><br></div>
  <div style="line-height: 1.5;"><span data-custom-class="body_text">We may need to share your personal information in the following situations:</span></div>
  <ul>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span data-custom-class="body_text"><strong>Business Transfers.</strong> We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.</span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span data-custom-class="body_text"><strong>Other Users.</strong> When you share personal information or otherwise interact with public areas of the Services, such personal information may be viewed by all users and may be publicly made available outside the Services in perpetuity.</span></li>
  </ul>
  <div><br></div>

  <div id="ai" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>4. DO WE OFFER ARTIFICIAL INTELLIGENCE-BASED PRODUCTS?</h2></span></strong>
    <span data-custom-class="body_text"><strong><em>In Short:</em></strong><em> We offer products, features, or tools powered by artificial intelligence, machine learning, or similar technologies.</em></span>
  </div>
  <div><br></div>
  <div style="line-height: 1.5;"><span data-custom-class="body_text">As part of our Services, we offer products, features, or tools powered by artificial intelligence, machine learning, or similar technologies (collectively, 'AI Products'). These tools are designed to enhance your experience and provide you with innovative solutions.</span></div>
  <div><br></div>
  <div style="line-height: 1.5;"><span data-custom-class="body_text"><strong>Use of AI Technologies</strong></span></div>
  <div><br></div>
  <div style="line-height: 1.5;"><span data-custom-class="body_text">We provide the AI Products through third-party service providers ('AI Service Providers'), including Gemini. Your input, output, and personal information will be shared with and processed by these AI Service Providers to enable your use of our AI Products.</span></div>
  <div><br></div>
  <div style="line-height: 1.5;"><span data-custom-class="body_text"><strong>Our AI Products</strong></span></div>
  <ul>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span data-custom-class="body_text">AI insights</span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span data-custom-class="body_text">AI predictive analytics</span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span data-custom-class="body_text">Natural language processing</span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span data-custom-class="body_text">Text analysis</span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span data-custom-class="body_text">AI translation</span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span data-custom-class="body_text">Video generation</span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span data-custom-class="body_text">Video analysis</span></li>
  </ul>
  <div><br></div>

  <div id="inforetain" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>5. HOW LONG DO WE KEEP YOUR INFORMATION?</h2></span></strong>
    <span data-custom-class="body_text"><strong><em>In Short: </em></strong><em>We keep your information for as long as necessary to fulfil the purposes outlined in this Privacy Notice unless otherwise required by law.</em></span>
  </div>
  <div><br></div>
  <div style="line-height: 1.5;"><span data-custom-class="body_text">We will only keep your personal information for as long as it is necessary for the purposes set out in this Privacy Notice, unless a longer retention period is required or permitted by law. No purpose in this notice will require us keeping your personal information for longer than the period of time in which users have an account with us.</span></div>
  <div><br></div>

  <div id="infosafe" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>6. HOW DO WE KEEP YOUR INFORMATION SAFE?</h2></span></strong>
    <span data-custom-class="body_text"><strong><em>In Short: </em></strong><em>We aim to protect your personal information through a system of organisational and technical security measures.</em></span>
  </div>
  <div><br></div>
  <div style="line-height: 1.5;"><span data-custom-class="body_text">We have implemented appropriate and reasonable technical and organisational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure. You should only access the Services within a secure environment.</span></div>
  <div><br></div>

  <div id="privacyrights" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>7. WHAT ARE YOUR PRIVACY RIGHTS?</h2></span></strong>
    <span data-custom-class="body_text"><strong><em>In Short:</em></strong><em> You may review, change, or terminate your account at any time, depending on your country, province, or state of residence.</em></span>
  </div>
  <div><br></div>
  <div id="withdrawconsent" style="line-height: 1.5;"><span data-custom-class="body_text"><strong><u>Withdrawing your consent:</u></strong> If we are relying on your consent to process your personal information, you have the right to withdraw your consent at any time by contacting us using the contact details provided in the section 'HOW CAN YOU CONTACT US ABOUT THIS NOTICE?' below.</span></div>
  <div><br></div>
  <div style="line-height: 1.5;"><span data-custom-class="heading_2"><strong><h3>Account Information</h3></strong></span>
    <span data-custom-class="body_text">If you would at any time like to review or change the information in your account or terminate your account, you can:</span>
  </div>
  <ul>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span data-custom-class="body_text">Log in to your account settings and update your user account.</span></li>
  </ul>
  <div style="line-height: 1.5;"><span data-custom-class="body_text">Upon your request to terminate your account, we will deactivate or delete your account and information from our active databases. However, we may retain some information in our files to prevent fraud, troubleshoot problems, assist with any investigations, enforce our legal terms and/or comply with applicable legal requirements.</span></div>
  <div><br></div>
  <div style="line-height: 1.5;"><span data-custom-class="body_text">If you have questions or comments about your privacy rights, you may email us at <a target="_blank" href="mailto:info@intellectaflow.com">info@intellectaflow.com</a>.</span></div>
  <div><br></div>

  <div id="DNT" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>8. CONTROLS FOR DO-NOT-TRACK FEATURES</h2></span></strong>
    <span data-custom-class="body_text">Most web browsers and some mobile operating systems and mobile applications include a Do-Not-Track ('DNT') feature or setting you can activate to signal your privacy preference not to have data about your online browsing activities monitored and collected. As such, we do not currently respond to DNT browser signals or any other mechanism that automatically communicates your choice not to be tracked online.</span>
  </div>
  <div><br></div>

  <div id="policyupdates" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>9. DO WE MAKE UPDATES TO THIS NOTICE?</h2></span></strong>
    <span data-custom-class="body_text"><em><strong>In Short: </strong>Yes, we will update this notice as necessary to stay compliant with relevant laws.</em></span>
  </div>
  <div><br></div>
  <div style="line-height: 1.5;"><span data-custom-class="body_text">We may update this Privacy Notice from time to time. The updated version will be indicated by an updated 'Revised' date at the top of this Privacy Notice. If we make material changes to this Privacy Notice, we may notify you either by prominently posting a notice of such changes or by directly sending you a notification.</span></div>
  <div><br></div>

  <div id="contact" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>10. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</h2></span></strong>
    <span data-custom-class="body_text">If you have questions or comments about this notice, you may email us at <a target="_blank" href="mailto:info@intellectaflow.com">info@intellectaflow.com</a> or contact us by post at:</span>
  </div>
  <div><br></div>
  <div style="line-height: 1.5;"><span data-custom-class="body_text">Intellectaflow LLP<br>Door No 1 93(16), P.G Block, The MANGALORE INSTITUTE OF TECHNOLOGY &amp; ENGINEERING<br>Badagamijar, Mijar<br>Mangalore, Karnataka 574225<br>India</span></div>
  <div><br></div>

  <div id="request" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>11. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?</h2></span></strong>
    <span data-custom-class="body_text">You have the right to request access to the personal information we collect from you, details about how we have processed it, correct inaccuracies, or delete your personal information. To request to review, update, or delete your personal information, please visit: <a target="_blank" href="https://adaptivetestingplatfromstudents-759082157852.asia-south1.run.app/">https://adaptivetestingplatfromstudents-759082157852.asia-south1.run.app/</a>.</span>
  </div>
</div>
`;

// ── Privacy Policy Modal ────────────────────────────────────────────────────
function PrivacyModal({ onClose }) {
  const overlayRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Prevent body scroll while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        animation: "fadeIn .18s ease",
      }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .privacy-modal-inner::-webkit-scrollbar { width: 5px; }
        .privacy-modal-inner::-webkit-scrollbar-track { background: transparent; }
        .privacy-modal-inner::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 4px; }
      `}</style>

      <div
        style={{
          background: "var(--card, #1a1a1f)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          width: "100%",
          maxWidth: 680,
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
          animation: "slideUp .22s ease",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <Icon n="shield" s={16} style={{ color: "var(--amber)" }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--white)" }}>
              Privacy &amp; Security
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border2)",
              borderRadius: 6,
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--muted)",
              fontSize: 16,
              lineHeight: 1,
              transition: "all .15s",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--border)";
              e.currentTarget.style.color = "var(--white)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--bg)";
              e.currentTarget.style.color = "var(--muted)";
            }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable content */}
        <div
          className="privacy-modal-inner"
          style={{
            overflowY: "auto",
            padding: "20px 24px 28px",
            lineHeight: 1.6,
          }}
          dangerouslySetInnerHTML={{ __html: PRIVACY_POLICY_HTML }}
        />

        {/* Footer */}
        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            justifyContent: "flex-end",
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "7px 18px",
              background: "var(--amber, #f0a500)",
              border: "none",
              borderRadius: 7,
              cursor: "pointer",
              color: "#000",
              fontSize: 13,
              fontWeight: 600,
              transition: "opacity .15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
// ───────────────────────────────────────────────────────────────────────────

function Toggle({ v, onChange, disabled }) {
  return (
    <button
      onClick={() => !disabled && onChange(!v)}
      style={{
        width: 38, height: 21, borderRadius: 11, border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        background: v ? "var(--amber)" : "var(--border2)",
        position: "relative", transition: "background .2s", flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div style={{
        position: "absolute", top: 2.5, left: v ? 19 : 2.5,
        width: 16, height: 16, borderRadius: "50%", background: "#fff",
        transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.3)",
      }} />
    </button>
  );
}

function Row({ label, desc, v, onChange, disabled }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "11px 0", borderBottom: "1px solid var(--border)",
    }}>
      <div>
        <div style={{ fontSize: 13, color: "var(--white)", marginBottom: desc ? 2 : 0 }}>{label}</div>
        {desc && <div style={{ fontSize: 11, color: "var(--muted)" }}>{desc}</div>}
      </div>
      <Toggle v={v} onChange={onChange} disabled={disabled} />
    </div>
  );
}

export default function SettingsPage({ theme, setTheme, setPage }){
  const [settings, setSettings] = useState({
    email_notifications: true,
    quiz_alerts: true,
    auto_fullscreen: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [showPrivacy, setShowPrivacy] = useState(false);

  useEffect(() => {
    getSettings()
      .then((data) => setSettings(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = useCallback(async (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value })); // optimistic
    setSaving(field);
    try {
      const updated = await updateSetting({ [field]: value });
      setSettings(updated); // sync with server
    } catch (err) {
      console.error("Failed to save setting:", err);
      setSettings((prev) => ({ ...prev, [field]: !value })); // rollback
    } finally {
      setSaving(null);
    }
  }, []);

  return (
    <>
      {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}

      <div style={{ padding: "24px 28px", maxWidth: 540, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 20 }}>
        <button onClick={() => setPage("profile")}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", display: "flex", alignItems: "center", gap: 3, fontSize: 12 }}>
          <Icon n="chevL" s={13} /> Back
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--white)" }}>Settings</h1>
      </div>

        {/* Appearance */}
        <div style={card({ padding: 20, marginBottom: 11 })}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--white)", marginBottom: 11 }}>
            Appearance
          </div>
          <div style={{ display: "flex", gap: 9 }}>
            {[["dark", "moon", "Dark"], ["light", "sun", "Light"]].map(([id, ico, lbl]) => (
              <button key={id} onClick={() => setTheme(id)}
                style={{
                  flex: 1, padding: "13px 0", display: "flex", flexDirection: "column",
                  alignItems: "center", gap: 7,
                  background: theme === id ? "rgba(240,165,0,0.07)" : "var(--bg)",
                  border: `1px solid ${theme === id ? "var(--amber)" : "var(--border2)"}`,
                  borderRadius: "var(--radius)", cursor: "pointer",
                  color: theme === id ? "var(--amber)" : "var(--muted)",
                  transition: "all .15s",
                }}>
                <Icon n={ico} s={17} />
                <span style={{ fontSize: 12, fontWeight: theme === id ? 600 : 400 }}>{lbl}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div style={card({ padding: 20, marginBottom: 11 })}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--white)", marginBottom: 4 }}>
            Notifications
          </div>
          <Row
            label="Email Notifications"
            desc="Updates via email"
            v={settings.email_notifications}
            onChange={(v) => handleToggle("email_notifications", v)}
            disabled={loading || saving === "email_notifications"}
          />
          <Row
            label="New Quiz Alerts"
            desc="When a teacher assigns a test"
            v={settings.quiz_alerts}
            onChange={(v) => handleToggle("quiz_alerts", v)}
            disabled={loading || saving === "quiz_alerts"}
          />
        </div>

        {/* Account */}
        <div style={card({ padding: 20 })}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--white)", marginBottom: 11 }}>
            Account
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <button
              onClick={() => setShowPrivacy(true)}
              style={{
                display: "flex", alignItems: "center", gap: 7, padding: "8px 12px",
                background: "var(--bg)", border: "1px solid var(--border)",
                borderRadius: "var(--radius)", cursor: "pointer", color: "var(--body)", fontSize: 13,
              }}
            >
              <Icon n="shield" s={14} /> Privacy &amp; Security
            </button>
            <button style={{
              display: "flex", alignItems: "center", gap: 7, padding: "8px 12px",
              background: "rgba(240,96,96,0.05)", border: "1px solid rgba(240,96,96,0.15)",
              borderRadius: "var(--radius)", cursor: "pointer", color: "var(--red)", fontSize: 13,
            }}>
              <Icon n="logout" s={14} /> Log Out
            </button>
          </div>
        </div>
      </div>
    </>
  );
}