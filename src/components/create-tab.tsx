import { useState, useRef, useCallback } from "react";
import { Tabs } from "@base-ui-components/react/tabs";
import { Field } from "@base-ui-components/react/field";
import { Progress } from "@base-ui-components/react/progress";

interface UploadResult {
	nanoid: string;
	url: string;
	name: string;
}

export function CreateTab() {
	const [mode, setMode] = useState<"upload" | "url">("upload");
	const [isDragging, setIsDragging] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [error, setError] = useState<string | null>(null);
	const [result, setResult] = useState<UploadResult | null>(null);
	const [urlInput, setUrlInput] = useState("");
	const [copied, setCopied] = useState(false);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
	}, []);

	const uploadFile = useCallback(async (file: File) => {
		setIsUploading(true);
		setUploadProgress(0);
		setError(null);

		try {
			const formData = new FormData();
			formData.append("file", file);

			// Simulate progress for better UX
			const progressInterval = setInterval(() => {
				setUploadProgress((prev) => Math.min(prev + 10, 90));
			}, 100);

			const response = await fetch("/api/upload", {
				method: "POST",
				body: formData,
			});

			clearInterval(progressInterval);
			setUploadProgress(100);

			if (!response.ok) {
				const data = (await response.json()) as { error?: string };
				throw new Error(data.error || "Upload failed");
			}

			const data = (await response.json()) as { nanoid: string };
			setResult({
				nanoid: data.nanoid,
				url: `https://${data.nanoid}.txt2mcp.com/mcp`,
				name: file.name,
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : "Upload failed");
		} finally {
			setIsUploading(false);
			setSelectedFile(null);
		}
	}, []);

	const uploadUrl = useCallback(async (url: string) => {
		setIsUploading(true);
		setUploadProgress(0);
		setError(null);

		try {
			const progressInterval = setInterval(() => {
				setUploadProgress((prev) => Math.min(prev + 5, 90));
			}, 150);

			const response = await fetch("/api/remote", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ url }),
			});

			clearInterval(progressInterval);
			setUploadProgress(100);

			if (!response.ok) {
				const data = (await response.json()) as { error?: string };
				throw new Error(data.error || "Upload failed");
			}

			const data = (await response.json()) as { nanoid: string };
			setResult({
				nanoid: data.nanoid,
				url: `https://${data.nanoid}.txt2mcp.com/mcp`,
				name: url,
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : "Upload failed");
		} finally {
			setIsUploading(false);
		}
	}, []);

	const handleDrop = useCallback(
		async (e: React.DragEvent) => {
			e.preventDefault();
			setIsDragging(false);

			const file = e.dataTransfer.files[0];
			if (file) {
				if (file.size > 10 * 1024 * 1024) {
					setError("File size must be less than 10MB");
					return;
				}
				setSelectedFile(file);
			}
		},
		[],
	);

	const handleFileSelect = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (file) {
				if (file.size > 10 * 1024 * 1024) {
					setError("File size must be less than 10MB");
					return;
				}
				setSelectedFile(file);
				setError(null);
			}
		},
		[],
	);

	const handleUrlSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			if (!urlInput.trim()) return;

			try {
				new URL(urlInput);
			} catch {
				setError("Please enter a valid URL");
				return;
			}

			await uploadUrl(urlInput);
		},
		[urlInput, uploadUrl],
	);

	const handleCopy = useCallback(async () => {
		if (result) {
			await navigator.clipboard.writeText(result.url);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	}, [result]);

	const handleReset = useCallback(() => {
		setResult(null);
		setError(null);
		setUrlInput("");
		setSelectedFile(null);
		setUploadProgress(0);
	}, []);

	const handleUploadClick = useCallback(async () => {
		if (selectedFile) {
			await uploadFile(selectedFile);
		}
	}, [selectedFile, uploadFile]);

	if (result) {
		return (
			<div className="space-y-6">
				<div className="result-card">
					<div className="result-icon">
						<svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
						</svg>
					</div>
					<h3 className="result-title">MCP Server Ready</h3>
					<p className="result-subtitle">Your server is live and ready to connect</p>

					<div className="url-display">
						<code>{result.url}</code>
						<button onClick={handleCopy} className="copy-btn" type="button">
							{copied ? (
								<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
								</svg>
							) : (
								<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
									/>
								</svg>
							)}
						</button>
					</div>

					<div className="result-meta">
						<span className="result-label">Source</span>
						<span className="result-value">{result.name}</span>
					</div>
				</div>

				<button onClick={handleReset} className="btn btn-secondary btn-full" type="button">
					Create Another Server
				</button>
			</div>
		);
	}

	return (
		<div className="create-container">
			<Tabs.Root
				value={mode}
				onValueChange={(value) => {
					setMode(value as "upload" | "url");
					setError(null);
					setSelectedFile(null);
				}}
			>
				<Tabs.List className="tab-list">
					<Tabs.Tab value="upload" className="tab-trigger">
						<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
						</svg>
						Upload File
					</Tabs.Tab>
					<Tabs.Tab value="url" className="tab-trigger">
						<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
						</svg>
						Remote URL
					</Tabs.Tab>
				</Tabs.List>

				{error && (
					<div className="error-message">
						<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						{error}
					</div>
				)}

				<Tabs.Panel value="upload" className="tab-panel">
					<div
						onDragOver={handleDragOver}
						onDragLeave={handleDragLeave}
						onDrop={handleDrop}
						onClick={() => fileInputRef.current?.click()}
						className={`upload-zone ${isDragging ? "dragging" : ""} ${selectedFile ? "has-file" : ""}`}
					>
						<input
							ref={fileInputRef}
							type="file"
							accept=".txt,.md,text/*"
							onChange={handleFileSelect}
							hidden
						/>

						{selectedFile ? (
							<>
								<div className="file-icon">
									<svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
									</svg>
								</div>
								<p className="file-name">{selectedFile.name}</p>
								<p className="file-size">{(selectedFile.size / 1024).toFixed(1)} KB</p>
							</>
						) : (
							<>
								<div className="upload-icon">
									<svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
									</svg>
								</div>
								<p className="upload-title">{isDragging ? "Drop your file here" : "Drag & drop a text file"}</p>
								<p className="upload-subtitle">or click to browse</p>
								<p className="upload-hint">Supports .txt, .md, and text files up to 10MB</p>
							</>
						)}
					</div>

					{isUploading && (
						<Progress.Root value={uploadProgress} className="progress-root">
							<Progress.Track className="progress-track">
								<Progress.Indicator className="progress-indicator" />
							</Progress.Track>
						</Progress.Root>
					)}

					<button
						onClick={handleUploadClick}
						disabled={!selectedFile || isUploading}
						className="btn btn-primary btn-full"
						type="button"
					>
						{isUploading ? (
							<>
								<svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="spinner">
									<circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
									<path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
								</svg>
								Creating Server...
							</>
						) : (
							"Create MCP Server"
						)}
					</button>
				</Tabs.Panel>

				<Tabs.Panel value="url" className="tab-panel">
					<form onSubmit={handleUrlSubmit} className="url-form">
						<Field.Root>
							<Field.Label className="field-label">Remote URL</Field.Label>
							<Field.Control
								type="url"
								value={urlInput}
								onChange={(e) => setUrlInput(e.target.value)}
								placeholder="https://example.com/docs.txt"
								className="field-input"
							/>
							<Field.Description className="field-description">
								Enter a URL to a text file. We'll fetch and index it automatically.
							</Field.Description>
						</Field.Root>

						{isUploading && (
							<Progress.Root value={uploadProgress} className="progress-root">
								<Progress.Track className="progress-track">
									<Progress.Indicator className="progress-indicator" />
								</Progress.Track>
							</Progress.Root>
						)}

						<button
							type="submit"
							disabled={!urlInput.trim() || isUploading}
							className="btn btn-primary btn-full"
						>
							{isUploading ? (
								<>
									<svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="spinner">
										<circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
										<path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
									</svg>
									Fetching & Creating...
								</>
							) : (
								"Create MCP Server"
							)}
						</button>
					</form>
				</Tabs.Panel>
			</Tabs.Root>
		</div>
	);
}
