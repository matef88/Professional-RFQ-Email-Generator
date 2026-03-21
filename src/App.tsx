/**
 * ════════════════════════════════════════════════════════════════
 * AUTOMAIL V2 - MAIN APPLICATION
 * ════════════════════════════════════════════════════════════════
 * 
 * AutoMail - Professional RFQ Email Generator
 * Version 2.0 - With threading, history, and link management
 */

import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  APP_CONFIG,
  COMPANY,
  TEMPLATES,
  getTemplateColor,
  getTemplateById,
} from "./config";
import {
  EmailFormData,
  DEFAULT_FORM_DATA,
  Email,
  EmailThread,
  SavedLink,
  EmailLine,
} from "./types";
import {
  generateId,
  generateThreadId,
  generateMessageId,
  buildSubject,
  buildEmailLines,
  linesToPlainText,
  generateMailtoUrl,
  generateEmlContent,
  downloadFile,
  generateFilename,
  copyToClipboard,
  validateForm,
  isValidEmailList,
  isValidUrl,
  formatDateTime,
  formatRelativeTime,
} from "./utils";
import {
  emailStorage,
  threadStorage,
  linkStorage,
  historyStorage,
  draftStorage,
  settingsStorage,
  exportData,
  importData,
  getStorageInfo,
} from "./storage";
import "./styles.css";

// ════════════════════════════════════════════════════════════════
// MAIN APP COMPONENT
// ════════════════════════════════════════════════════════════════

export default function AutoMailV2() {
  // Form state
  const [formData, setFormData] = useState<EmailFormData>(() => ({
    ...DEFAULT_FORM_DATA,
    docsLink: APP_CONFIG.defaults.companyDocsLink || "",
    ...draftStorage.get(),
  }));
  const [subjectOverride, setSubjectOverride] = useState("");
  const [isEditingSubject, setIsEditingSubject] = useState(false);

  // UI state
  const [activeTab, setActiveTab] = useState<"compose" | "history" | "links">("compose");
  const [showLinkPicker, setShowLinkPicker] = useState<"package" | "docs" | null>(null);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  // Status state
  const [copiedBody, setCopiedBody] = useState(false);
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [sentStatus, setSentStatus] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Data state
  const [emailHistory, setEmailHistory] = useState<Email[]>([]);
  const [savedLinks, setSavedLinks] = useState<SavedLink[]>([]);
  const [threads, setThreads] = useState<EmailThread[]>([]);
  const [linkSearchQuery, setLinkSearchQuery] = useState("");

  // Refs
  const subjectInputRef = useRef<HTMLInputElement>(null);

  // ════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ════════════════════════════════════════════════════════════════

  useEffect(() => {
    // Load data from storage
    setEmailHistory(emailStorage.getAll());
    setSavedLinks(linkStorage.getAll());
    setThreads(threadStorage.getAll());
  }, []);

  // Auto-save draft
  useEffect(() => {
    if (APP_CONFIG.storage.prefix) {
      draftStorage.save(formData);
    }
  }, [formData]);

  // Focus subject input when editing
  useEffect(() => {
    if (isEditingSubject && subjectInputRef.current) {
      subjectInputRef.current.focus();
    }
  }, [isEditingSubject]);

  // ════════════════════════════════════════════════════════════════
  // COMPUTED VALUES
  // ════════════════════════════════════════════════════════════════

  const accentColor = getTemplateColor(formData.template);

  const autoSubject = useMemo(
    () =>
      buildSubject(
        formData.template,
        formData.packageName,
        formData.reference,
        formData.deadline
      ),
    [formData.template, formData.packageName, formData.reference, formData.deadline]
  );

  const subject = subjectOverride || autoSubject;

  const emailLines = useMemo(() => buildEmailLines(formData), [formData]);

  const plainBody = useMemo(() => linesToPlainText(emailLines), [emailLines]);

  const validation = useMemo(() => validateForm(formData), [formData]);

  const isReady = validation.isValid;

  const emailValid = isValidEmailList(formData.supplierEmails);
  const ccValid = isValidEmailList(formData.cc);

  const mailtoLength = useMemo(
    () =>
      encodeURIComponent(subject).length + encodeURIComponent(plainBody).length,
    [subject, plainBody]
  );
  const mailtoWarning = mailtoLength > 1900;

  // Filtered links
  const filteredLinks = useMemo(() => {
    if (!linkSearchQuery) return savedLinks;
    const query = linkSearchQuery.toLowerCase();
    return savedLinks.filter(
      (l) =>
        l.name.toLowerCase().includes(query) ||
        l.url.toLowerCase().includes(query) ||
        l.packageName?.toLowerCase().includes(query)
    );
  }, [savedLinks, linkSearchQuery]);

  // ════════════════════════════════════════════════════════════════
  // HANDLERS
  // ════════════════════════════════════════════════════════════════

  const updateField = useCallback((key: keyof EmailFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  }, []);

  const handleTemplateChange = useCallback((templateId: string) => {
    setFormData((prev) => ({ ...prev, template: templateId }));
  }, []);

  const handleReset = useCallback(() => {
    setFormData({
      ...DEFAULT_FORM_DATA,
      docsLink: APP_CONFIG.defaults.companyDocsLink || "",
    });
    setSubjectOverride("");
    setIsEditingSubject(false);
    setTouched({});
    draftStorage.clear();
  }, []);

  const handleCopyBody = useCallback(async () => {
    const success = await copyToClipboard(plainBody);
    if (success) {
      setCopiedBody(true);
      setTimeout(() => setCopiedBody(false), 2500);
    }
  }, [plainBody]);

  const handleCopySubject = useCallback(async () => {
    const success = await copyToClipboard(subject);
    if (success) {
      setCopiedSubject(true);
      setTimeout(() => setCopiedSubject(false), 2500);
    }
  }, [subject]);

  const handleSendEmail = useCallback(() => {
    if (!isReady) return;

    // Create email record
    const email: Email = {
      id: generateId(),
      timestamp: Date.now(),
      formData: { ...formData },
      subject,
      bodyPlain: plainBody,
      status: "sent",
      threadId: formData.threadId || generateThreadId(),
      parentEmailId: formData.parentEmailId,
      replyCount: 0,
      mailtoUrl: generateMailtoUrl(
        formData.supplierEmails,
        formData.cc,
        subject,
        plainBody
      ),
    };

    // Save to storage
    emailStorage.save(email);
    threadStorage.addEmailToThread(email);
    historyStorage.add({ emailId: email.id, action: "sent" });

    // Save links if provided
    if (formData.packageLink) {
      linkStorage.save({
        name: formData.packageName || "Package Link",
        url: formData.packageLink,
        type: "package",
        packageName: formData.packageName,
      });
    }
    if (formData.docsLink) {
      linkStorage.save({
        name: "Company Documents",
        url: formData.docsLink,
        type: "docs",
      });
    }

    // Open mailto
    window.open(email.mailtoUrl, "_blank");

    // Update state
    setEmailHistory(emailStorage.getAll());
    setThreads(threadStorage.getAll());
    setSavedLinks(linkStorage.getAll());

    setSentStatus(true);
    setTimeout(() => setSentStatus(false), 3000);
  }, [isReady, formData, subject, plainBody]);

  const handleDownloadTxt = useCallback(() => {
    if (!isReady) return;
    const header = `TO: ${formData.supplierEmails || formData.supplierName}\n${
      formData.cc ? `CC: ${formData.cc}\n` : ""
    }SUBJECT: ${subject}\n\n`;
    downloadFile(header + plainBody, generateFilename(formData.supplierName, "txt"), "text/plain");
  }, [isReady, formData, subject, plainBody]);

  const handleDownloadEml = useCallback(() => {
    if (!isReady) return;
    const emlContent = generateEmlContent(
      formData.supplierEmails,
      formData.cc,
      subject,
      plainBody,
      generateMessageId()
    );
    downloadFile(emlContent, generateFilename(formData.supplierName, "eml"), "message/rfc822");
  }, [isReady, formData, subject, plainBody]);

  const handleSelectLink = useCallback((link: SavedLink, type: "package" | "docs") => {
    if (type === "package") {
      updateField("packageLink", link.url);
      if (link.packageName && !formData.packageName) {
        updateField("packageName", link.packageName);
      }
    } else {
      updateField("docsLink", link.url);
    }
    setShowLinkPicker(null);
  }, [formData.packageName, updateField]);

  const handleFollowUp = useCallback((email: Email) => {
    setFormData({
      ...DEFAULT_FORM_DATA,
      template: "followUp",
      supplierName: email.formData.supplierName,
      supplierEmails: email.formData.supplierEmails,
      cc: email.formData.cc,
      packageName: email.formData.packageName,
      reference: email.formData.reference,
      packageLink: email.formData.packageLink,
      docsLink: email.formData.docsLink,
      parentEmailId: email.id,
      threadId: email.threadId,
    });
    setActiveTab("compose");
  }, []);

  const handleExportData = useCallback(() => {
    const data = exportData();
    downloadFile(
      JSON.stringify(data, null, 2),
      `automail_backup_${new Date().toISOString().split("T")[0]}.json`,
      "application/json"
    );
  }, []);

  // ════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════

  return (
    <div className="app-container" style={{ "--accent": accentColor } as React.CSSProperties}>
      {/* Header */}
      <Header
        companyName={COMPANY.name}
        companyShortName={COMPANY.shortName}
        accentColor={accentColor}
        isReady={isReady}
        onReset={handleReset}
        onExport={handleExportData}
      />

      {/* Tab Bar */}
      <TabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        historyCount={emailHistory.length}
        linksCount={savedLinks.length}
      />

      {/* Main Content */}
      <div className="main-content">
        {activeTab === "compose" && (
          <>
            {/* Left Panel - Form */}
            <LeftPanel
              formData={formData}
              touched={touched}
              accentColor={accentColor}
              emailValid={emailValid}
              ccValid={ccValid}
              onUpdateField={updateField}
              onTemplateChange={handleTemplateChange}
              onSubjectEdit={() => setIsEditingSubject(true)}
              showLinkPicker={showLinkPicker}
              setShowLinkPicker={setShowLinkPicker}
              savedLinks={filteredLinks}
              linkSearchQuery={linkSearchQuery}
              setLinkSearchQuery={setLinkSearchQuery}
              onSelectLink={handleSelectLink}
            />

            {/* Right Panel - Preview */}
            <RightPanel
              formData={formData}
              subject={subject}
              subjectOverride={subjectOverride}
              isEditingSubject={isEditingSubject}
              accentColor={accentColor}
              emailLines={emailLines}
              plainBody={plainBody}
              isReady={isReady}
              copiedBody={copiedBody}
              copiedSubject={copiedSubject}
              sentStatus={sentStatus}
              mailtoWarning={mailtoWarning}
              subjectInputRef={subjectInputRef}
              onSubjectChange={setSubjectOverride}
              onSubjectBlur={() => {
                if (!subjectOverride.trim()) setSubjectOverride("");
                setIsEditingSubject(false);
              }}
              onCopyBody={handleCopyBody}
              onCopySubject={handleCopySubject}
              onSendEmail={handleSendEmail}
              onDownloadTxt={handleDownloadTxt}
              onDownloadEml={handleDownloadEml}
            />
          </>
        )}

        {activeTab === "history" && (
          <HistoryPanel
            emails={emailHistory}
            threads={threads}
            selectedEmailId={selectedEmailId}
            selectedThreadId={selectedThreadId}
            onSelectEmail={setSelectedEmailId}
            onSelectThread={setSelectedThreadId}
            onFollowUp={handleFollowUp}
          />
        )}

        {activeTab === "links" && (
          <LinksPanel
            links={savedLinks}
            onDeleteLink={(id) => {
              linkStorage.delete(id);
              setSavedLinks(linkStorage.getAll());
            }}
          />
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ════════════════════════════════════════════════════════════════

interface HeaderProps {
  companyName: string;
  companyShortName: string;
  accentColor: string;
  isReady: boolean;
  onReset: () => void;
  onExport: () => void;
}

function Header({
  companyName,
  companyShortName,
  accentColor,
  isReady,
  onReset,
  onExport,
}: HeaderProps) {
  return (
    <header className="app-header">
      <div className="header-left">
        <div className="logo" style={{ background: accentColor }}>
          {companyShortName}
        </div>
        <span className="app-title">AutoMail</span>
        <span className="version-badge">v2</span>
      </div>
      <div className="header-right">
        <button className="btn-ghost" onClick={onExport}>
          ⬇ Export
        </button>
        <button className="btn-ghost" onClick={onReset}>
          ↺ Reset
        </button>
        <div className="status-indicator">
          <span
            className="status-dot"
            style={{ background: isReady ? "#22c55e" : "#ef4444" }}
          />
          {isReady ? "Ready" : "Required fields missing"}
        </div>
      </div>
    </header>
  );
}

interface TabBarProps {
  activeTab: "compose" | "history" | "links";
  onTabChange: (tab: "compose" | "history" | "links") => void;
  historyCount: number;
  linksCount: number;
}

function TabBar({ activeTab, onTabChange, historyCount, linksCount }: TabBarProps) {
  return (
    <div className="tab-bar">
      <button
        className={`tab-btn ${activeTab === "compose" ? "active" : ""}`}
        onClick={() => onTabChange("compose")}
      >
        ✉️ Compose
      </button>
      <button
        className={`tab-btn ${activeTab === "history" ? "active" : ""}`}
        onClick={() => onTabChange("history")}
      >
        📋 History {historyCount > 0 && <span className="badge">{historyCount}</span>}
      </button>
      <button
        className={`tab-btn ${activeTab === "links" ? "active" : ""}`}
        onClick={() => onTabChange("links")}
      >
        🔗 Links {linksCount > 0 && <span className="badge">{linksCount}</span>}
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// LEFT PANEL - FORM
// ════════════════════════════════════════════════════════════════

interface LeftPanelProps {
  formData: EmailFormData;
  touched: Record<string, boolean>;
  accentColor: string;
  emailValid: boolean;
  ccValid: boolean;
  onUpdateField: (key: keyof EmailFormData, value: string) => void;
  onTemplateChange: (template: string) => void;
  onSubjectEdit: () => void;
  showLinkPicker: "package" | "docs" | null;
  setShowLinkPicker: (picker: "package" | "docs" | null) => void;
  savedLinks: SavedLink[];
  linkSearchQuery: string;
  setLinkSearchQuery: (query: string) => void;
  onSelectLink: (link: SavedLink, type: "package" | "docs") => void;
}

function LeftPanel({
  formData,
  touched,
  accentColor,
  emailValid,
  ccValid,
  onUpdateField,
  onTemplateChange,
  showLinkPicker,
  setShowLinkPicker,
  savedLinks,
  linkSearchQuery,
  setLinkSearchQuery,
  onSelectLink,
}: LeftPanelProps) {
  return (
    <div className="left-panel">
      {/* Template Selector */}
      <Section label="Template">
        <div className="template-grid">
          {TEMPLATES.map((template) => (
            <button
              key={template.id}
              className={`template-btn ${formData.template === template.id ? "active" : ""}`}
              style={{
                borderColor: formData.template === template.id ? template.color : undefined,
                background: formData.template === template.id ? `${template.color}15` : undefined,
                color: formData.template === template.id ? template.color : undefined,
              }}
              onClick={() => onTemplateChange(template.id)}
            >
              <span className="template-icon">{template.icon}</span>
              <span className="template-name">{template.name}</span>
            </button>
          ))}
        </div>
      </Section>

      {/* Recipient */}
      <Section label="Recipient">
        <Field
          label="Supplier / Company Name"
          required
          value={formData.supplierName}
          onChange={(v) => onUpdateField("supplierName", v)}
          placeholder="e.g., Ahmed Trading Co."
          error={touched.supplierName && !formData.supplierName.trim()}
        />
        <Field
          label="Supplier Email(s)"
          hint="Comma-separate for multiple"
          value={formData.supplierEmails}
          onChange={(v) => onUpdateField("supplierEmails", v)}
          placeholder="info@supplier.com, sales@supplier.com"
          error={touched.supplierEmails && !emailValid}
        />
        <Field
          label="CC"
          hint="Internal team, PM"
          value={formData.cc}
          onChange={(v) => onUpdateField("cc", v)}
          placeholder="pm@company.com"
          error={touched.cc && !ccValid}
        />
      </Section>

      {/* Package */}
      <Section label="Package & Reference">
        <Field
          label="Package Name"
          required
          value={formData.packageName}
          onChange={(v) => onUpdateField("packageName", v)}
          placeholder="e.g., MEP Works Phase 2"
          error={touched.packageName && !formData.packageName.trim()}
        />
        <Field
          label="Reference / Project No."
          hint="Shows in subject"
          value={formData.reference}
          onChange={(v) => onUpdateField("reference", v)}
          placeholder="e.g., EN-RFQ-2026-045"
        />
        <div className="field">
          <label className="field-label">
            Submission Deadline
            <span className="field-hint">In subject + body</span>
          </label>
          <input
            type="date"
            className="field-input"
            value={formData.deadline}
            onChange={(e) => onUpdateField("deadline", e.target.value)}
          />
        </div>
      </Section>

      {/* Links */}
      <Section label="Links">
        <div className="field">
          <label className="field-label">Package Details Link</label>
          <div className="input-with-btn">
            <input
              type="url"
              className="field-input"
              value={formData.packageLink}
              onChange={(e) => onUpdateField("packageLink", e.target.value)}
              placeholder="https://..."
            />
            <button
              className="btn-pick"
              onClick={() => setShowLinkPicker(showLinkPicker === "package" ? null : "package")}
            >
              📁
            </button>
          </div>
          {showLinkPicker === "package" && (
            <LinkPicker
              links={savedLinks.filter((l) => l.type === "package" || l.type === "other")}
              searchQuery={linkSearchQuery}
              onSearchChange={setLinkSearchQuery}
              onSelect={(link) => onSelectLink(link, "package")}
              onClose={() => setShowLinkPicker(null)}
            />
          )}
        </div>
        <div className="field">
          <label className="field-label">Company Documents Link</label>
          <div className="input-with-btn">
            <input
              type="url"
              className="field-input"
              value={formData.docsLink}
              onChange={(e) => onUpdateField("docsLink", e.target.value)}
              placeholder="https://..."
            />
            <button
              className="btn-pick"
              onClick={() => setShowLinkPicker(showLinkPicker === "docs" ? null : "docs")}
            >
              📁
            </button>
          </div>
          {showLinkPicker === "docs" && (
            <LinkPicker
              links={savedLinks.filter((l) => l.type === "docs")}
              searchQuery={linkSearchQuery}
              onSearchChange={setLinkSearchQuery}
              onSelect={(link) => onSelectLink(link, "docs")}
              onClose={() => setShowLinkPicker(null)}
            />
          )}
        </div>
      </Section>

      {/* Additional Details */}
      <Section label="Additional Details">
        <Field
          label="Project Requirements"
          multiline
          value={formData.details}
          onChange={(v) => onUpdateField("details", v)}
          placeholder="Specs, scope notes, conditions..."
        />
      </Section>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// RIGHT PANEL - PREVIEW
// ════════════════════════════════════════════════════════════════

interface RightPanelProps {
  formData: EmailFormData;
  subject: string;
  subjectOverride: string;
  isEditingSubject: boolean;
  accentColor: string;
  emailLines: EmailLine[];
  plainBody: string;
  isReady: boolean;
  copiedBody: boolean;
  copiedSubject: boolean;
  sentStatus: boolean;
  mailtoWarning: boolean;
  subjectInputRef: React.RefObject<HTMLInputElement>;
  onSubjectChange: (value: string) => void;
  onSubjectBlur: () => void;
  onCopyBody: () => void;
  onCopySubject: () => void;
  onSendEmail: () => void;
  onDownloadTxt: () => void;
  onDownloadEml: () => void;
}

function RightPanel({
  formData,
  subject,
  subjectOverride,
  isEditingSubject,
  accentColor,
  emailLines,
  plainBody,
  isReady,
  copiedBody,
  copiedSubject,
  sentStatus,
  mailtoWarning,
  subjectInputRef,
  onSubjectChange,
  onSubjectBlur,
  onCopyBody,
  onCopySubject,
  onSendEmail,
  onDownloadTxt,
  onDownloadEml,
}: RightPanelProps) {
  return (
    <div className="right-panel">
      {/* Action Bar */}
      <div className="action-bar">
        <button
          className="btn-primary"
          style={{ background: isReady ? accentColor : undefined }}
          disabled={!isReady}
          onClick={onSendEmail}
        >
          {sentStatus ? "✓ Opened" : "✉️ Send Email"}
        </button>
        <button className="btn-secondary" disabled={!isReady} onClick={onCopyBody}>
          {copiedBody ? "✓ Copied" : "📋 Copy Body"}
        </button>
        <button className="btn-secondary" onClick={onCopySubject}>
          {copiedSubject ? "✓ Subj" : "📎 Copy Subj"}
        </button>
        <button className="btn-secondary" disabled={!isReady} onClick={onDownloadTxt}>
          ⬇ .txt
        </button>
        <button className="btn-secondary" disabled={!isReady} onClick={onDownloadEml}>
          ⬇ .eml
        </button>
        {mailtoWarning && (
          <div className="warning-badge">
            ⚠️ Body long — use Copy or .eml
          </div>
        )}
      </div>

      {/* Subject Bar */}
      <div className="subject-bar">
        <span className="subject-label">Subject</span>
        {isEditingSubject ? (
          <input
            ref={subjectInputRef}
            className="subject-input"
            value={subjectOverride || subject}
            onChange={(e) => onSubjectChange(e.target.value)}
            onBlur={onSubjectBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              if (e.key === "Escape") {
                onSubjectChange("");
                onSubjectBlur();
              }
            }}
          />
        ) : (
          <div
            className="subject-display"
            style={{ color: subject ? accentColor : undefined }}
            onClick={() => {}}
          >
            {subject || "Fill package name..."}
          </div>
        )}
        {!isEditingSubject && (
          <span className="subject-edit" onClick={() => {}}>
            {subjectOverride ? "custom" : "edit"}
          </span>
        )}
      </div>

      {/* Email Preview */}
      <div className="preview-container">
        <div className="email-card">
          {/* Email Header */}
          <div className="email-header" style={{ borderBottomColor: accentColor }}>
            <div className="email-header-row">
              <div>
                <div className="email-header-label">From</div>
                <div className="email-header-value">{COMPANY.name}</div>
                <div className="email-header-sub">{COMPANY.tagline}</div>
              </div>
              <div className="email-header-right">
                <div className="email-header-label">To</div>
                <div className="email-header-value">{formData.supplierName || "—"}</div>
                {formData.supplierEmails && (
                  <div className="email-header-sub">{formData.supplierEmails}</div>
                )}
                {formData.cc && (
                  <div className="email-header-sub">CC: {formData.cc}</div>
                )}
              </div>
            </div>
            {subject && (
              <div className="email-subject-box" style={{ borderColor: `${accentColor}25`, background: `${accentColor}10` }}>
                <div className="email-subject-label">Subject</div>
                <div className="email-subject-value" style={{ color: accentColor }}>
                  {subject}
                </div>
              </div>
            )}
          </div>

          {/* Email Body */}
          <div className="email-body">
            {emailLines.map((line, index) => (
              <EmailLineRenderer key={index} line={line} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// EMAIL LINE RENDERER
// ════════════════════════════════════════════════════════════════

function EmailLineRenderer({ line }: { line: EmailLine }) {
  switch (line.type) {
    case "g":
      return <div className="email-gap" />;
    case "txt":
      return <div className="email-text">{line.value}</div>;
    case "hd":
      return <div className="email-heading">{line.value}</div>;
    case "lbl":
      return <div className="email-label">{line.value}</div>;
    case "lnk":
      return (
        <div className="email-link-row">
          <span className="email-link-label">{line.label}: </span>
          <a href={line.url} target="_blank" rel="noopener noreferrer" className="email-link">
            {line.url}
          </a>
        </div>
      );
    case "bul":
      return <div className="email-bullet">• {line.value}</div>;
    case "urg":
      return <div className="email-urgent">{line.value}</div>;
    case "sig":
      return <div className="email-signature">{line.value}</div>;
    case "div":
      return <div className="email-divider">{line.value}</div>;
    case "dis":
      return <div className="email-disclaimer">{line.value}</div>;
    case "quote":
      return <div className="email-quote">{line.value}</div>;
    default:
      return <div>{line.value}</div>;
  }
}

// ════════════════════════════════════════════════════════════════
// HISTORY PANEL
// ════════════════════════════════════════════════════════════════

interface HistoryPanelProps {
  emails: Email[];
  threads: EmailThread[];
  selectedEmailId: string | null;
  selectedThreadId: string | null;
  onSelectEmail: (id: string | null) => void;
  onSelectThread: (id: string | null) => void;
  onFollowUp: (email: Email) => void;
}

function HistoryPanel({
  emails,
  threads,
  selectedEmailId,
  onSelectEmail,
  onFollowUp,
}: HistoryPanelProps) {
  const [viewMode, setViewMode] = useState<"list" | "threads">("list");
  const selectedEmail = selectedEmailId ? emails.find((e) => e.id === selectedEmailId) : null;

  return (
    <div className="history-panel">
      <div className="history-list">
        <div className="history-header">
          <h3>📧 Email History</h3>
          <div className="view-toggle">
            <button
              className={viewMode === "list" ? "active" : ""}
              onClick={() => setViewMode("list")}
            >
              List
            </button>
            <button
              className={viewMode === "threads" ? "active" : ""}
              onClick={() => setViewMode("threads")}
            >
              Threads
            </button>
          </div>
        </div>

        {emails.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <p>No emails sent yet</p>
            <p className="empty-hint">Your sent emails will appear here</p>
          </div>
        ) : (
          <div className="email-list">
            {emails.map((email) => (
              <div
                key={email.id}
                className={`email-list-item ${selectedEmailId === email.id ? "selected" : ""}`}
                onClick={() => onSelectEmail(email.id)}
              >
                <div className="email-list-icon">
                  {getTemplateById(email.formData.template)?.icon || "📧"}
                </div>
                <div className="email-list-content">
                  <div className="email-list-row">
                    <span className="email-list-supplier">{email.formData.supplierName}</span>
                    <span className="email-list-time">{formatRelativeTime(email.timestamp)}</span>
                  </div>
                  <div className="email-list-package">{email.formData.packageName}</div>
                  <div className="email-list-subject">{email.subject}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedEmail && (
        <div className="history-detail">
          <div className="history-detail-header">
            <h3>Email Details</h3>
            <button className="btn-close" onClick={() => onSelectEmail(null)}>
              ✕
            </button>
          </div>
          <div className="history-detail-meta">
            <div className="meta-row">
              <span className="meta-label">To:</span>
              <span className="meta-value">{selectedEmail.formData.supplierName}</span>
            </div>
            <div className="meta-row">
              <span className="meta-label">Email:</span>
              <span className="meta-value">{selectedEmail.formData.supplierEmails || "—"}</span>
            </div>
            <div className="meta-row">
              <span className="meta-label">Package:</span>
              <span className="meta-value">{selectedEmail.formData.packageName}</span>
            </div>
            <div className="meta-row">
              <span className="meta-label">Sent:</span>
              <span className="meta-value">{formatDateTime(selectedEmail.timestamp)}</span>
            </div>
            <div className="meta-row">
              <span className="meta-label">Subject:</span>
              <span className="meta-value">{selectedEmail.subject}</span>
            </div>
          </div>
          <div className="history-detail-body">
            <pre>{selectedEmail.bodyPlain}</pre>
          </div>
          <div className="history-detail-actions">
            <button className="btn-primary" onClick={() => onFollowUp(selectedEmail)}>
              🔄 Follow Up
            </button>
            <button
              className="btn-secondary"
              onClick={() => copyToClipboard(selectedEmail.bodyPlain)}
            >
              📋 Copy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// LINKS PANEL
// ════════════════════════════════════════════════════════════════

interface LinksPanelProps {
  links: SavedLink[];
  onDeleteLink: (id: string) => void;
}

function LinksPanel({ links, onDeleteLink }: LinksPanelProps) {
  const [localSearch, setLocalSearch] = useState("");
  const filteredLinks = localSearch
    ? links.filter(
        (l) =>
          l.name.toLowerCase().includes(localSearch.toLowerCase()) ||
          l.url.toLowerCase().includes(localSearch.toLowerCase()) ||
          l.packageName?.toLowerCase().includes(localSearch.toLowerCase())
      )
    : links;

  return (
    <div className="links-panel">
      <div className="links-header">
        <h3>🔗 Saved Links</h3>
        <input
          type="text"
          className="search-input"
          placeholder="Search links..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
        />
      </div>

      {links.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🔗</span>
          <p>No saved links yet</p>
          <p className="empty-hint">Links from sent emails will be saved here</p>
        </div>
      ) : filteredLinks.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🔍</span>
          <p>No links match your search</p>
          <p className="empty-hint">Try a different search term</p>
        </div>
      ) : (
        <div className="links-grid">
          {filteredLinks.map((link) => (
            <div key={link.id} className="link-card">
              <div className="link-card-header">
                <span className="link-type-badge" data-type={link.type}>
                  {link.type === "package" ? "📦" : link.type === "docs" ? "📄" : "🔗"}
                </span>
                <span className="link-name">{link.name}</span>
              </div>
              {link.packageName && (
                <div className="link-package">{link.packageName}</div>
              )}
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="link-url"
              >
                {link.url.length > 50 ? `${link.url.substring(0, 50)}...` : link.url}
              </a>
              <div className="link-meta">
                <span>Used {link.usageCount}x</span>
                <span>•</span>
                <span>{formatRelativeTime(link.lastUsed)}</span>
              </div>
              <div className="link-actions">
                <button
                  className="btn-icon"
                  onClick={() => copyToClipboard(link.url)}
                  title="Copy URL"
                >
                  📋
                </button>
                <button
                  className="btn-icon danger"
                  onClick={() => onDeleteLink(link.id)}
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// REUSABLE COMPONENTS
// ════════════════════════════════════════════════════════════════

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="section">
      <div className="section-label">{label}</div>
      <div className="section-content">{children}</div>
    </div>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  required?: boolean;
  multiline?: boolean;
  error?: boolean;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
  required,
  multiline,
  error,
}: FieldProps) {
  return (
    <div className="field">
      <label className="field-label">
        {label}
        {required && <span className="required">*</span>}
        {hint && <span className="field-hint">{hint}</span>}
      </label>
      {multiline ? (
        <textarea
          className={`field-textarea ${error ? "error" : ""}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <input
          type="text"
          className={`field-input ${error ? "error" : ""}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
      {error && <div className="field-error">{required ? "Required" : "Invalid format"}</div>}
    </div>
  );
}

interface LinkPickerProps {
  links: SavedLink[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelect: (link: SavedLink) => void;
  onClose: () => void;
}

function LinkPicker({ links, searchQuery, onSearchChange, onSelect, onClose }: LinkPickerProps) {
  return (
    <div className="link-picker">
      <div className="link-picker-header">
        <input
          type="text"
          className="link-picker-search"
          placeholder="Search saved links..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          autoFocus
        />
        <button className="btn-close" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="link-picker-list">
        {links.length === 0 ? (
          <div className="link-picker-empty">No saved links</div>
        ) : (
          links.map((link) => (
            <div
              key={link.id}
              className="link-picker-item"
              onClick={() => onSelect(link)}
            >
              <span className="link-picker-icon">
                {link.type === "package" ? "📦" : "📄"}
              </span>
              <div className="link-picker-info">
                <div className="link-picker-name">{link.name}</div>
                <div className="link-picker-url">{link.url}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
