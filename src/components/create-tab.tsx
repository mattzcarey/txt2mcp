import { useState, useRef, useCallback } from "react";
import { clsx } from "clsx";

interface UploadResult {
	nanoid: string;
	url: string;
	name: string;
}

export function CreateTab() {
	const [mode, setMode] = useState<"upload" | "url">("upload");
	const [isDragging, setIsDragging] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [result, setResult] = useState<UploadResult | null>(null);
	const [urlInput, setUrlInput] = useState("");
	const [copied, setCopied] = useState(false);
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
		setError(null);

		try {
			const formData = new FormData();
			formData.append("file", file);

			const response = await fetch("/api/upload", {
				method: "POST",
				body: formData,
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || "Upload failed");
			}

			const data = await response.json();
			setResult({
				nanoid: data.nanoid,
				url: `https://${data.nanoid}.txt2mcp.com`,
				name: file.name,
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : "Upload failed");
		} finally {
			setIsUploading(false);
		}
	}, []);

	const uploadUrl = useCallback(async (url: string) => {
		setIsUploading(true);
		setError(null);

		try {
			const response = await fetch("/api/remote", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ url }),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || "Upload failed");
			}

			const data = await response.json();
			setResult({
				nanoid: data.nanoid,
				url: `https://${data.nanoid}.txt2mcp.com`,
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
				await uploadFile(file);
			}
		},
		[uploadFile],
	);

	const handleFileSelect = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (file) {
				if (file.size > 10 * 1024 * 1024) {
					setError("File size must be less than 10MB");
					return;
				}
				await uploadFile(file);
			}
		},
		[uploadFile],
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
	}, []);

	if (result) {
		return (
			<div className="space-y-6">
				<div className="bg-card border border-border rounded-xl p-8 text-center">
					<div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
						<svg
							className="w-6 h-6 text-success"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M5 13l4 4L19 7"
							/>
						</svg>
					</div>
					<h3 className="text-lg font-medium mb-2">MCP Server Created</h3>
					<p className="text-muted text-sm mb-6">Your MCP server is ready to use</p>

					<div className="bg-background border border-border rounded-lg p-4 mb-6">
						<div className="flex items-center justify-between gap-4">
							<code className="text-sm font-mono text-accent break-all">{result.url}</code>
							<button
								onClick={handleCopy}
								className="flex-shrink-0 p-2 hover:bg-card rounded-lg transition-colors"
							>
								{copied ? (
									<svg
										className="w-4 h-4 text-success"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M5 13l4 4L19 7"
										/>
									</svg>
								) : (
									<svg
										className="w-4 h-4 text-muted"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
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
					</div>

					<p className="text-xs text-muted">
						ID: <span className="font-mono">{result.nanoid}</span>
					</p>
				</div>

				<button
					onClick={handleReset}
					className="w-full py-3 bg-card hover:bg-card-hover border border-border rounded-lg font-medium transition-colors"
				>
					Create Another
				</button>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Mode Toggle */}
			<div className="flex bg-card rounded-lg p-1">
				<button
					onClick={() => setMode("upload")}
					className={clsx(
						"flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-colors",
						mode === "upload"
							? "bg-background text-foreground"
							: "text-muted hover:text-foreground",
					)}
				>
					Upload File
				</button>
				<button
					onClick={() => setMode("url")}
					className={clsx(
						"flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-colors",
						mode === "url" ? "bg-background text-foreground" : "text-muted hover:text-foreground",
					)}
				>
					Remote URL
				</button>
			</div>

			{error && (
				<div className="bg-error/10 border border-error/20 rounded-lg p-4 text-error text-sm">
					{error}
				</div>
			)}

			{mode === "upload" ? (
				<div
					onDragOver={handleDragOver}
					onDragLeave={handleDragLeave}
					onDrop={handleDrop}
					onClick={() => fileInputRef.current?.click()}
					className={clsx(
						"border-2 border-dashed rounded-xl p-16 text-center cursor-pointer transition-all",
						isDragging ? "border-accent bg-accent/5" : "border-border hover:border-border-light",
					)}
				>
					<input
						ref={fileInputRef}
						type="file"
						accept=".txt,text/*"
						onChange={handleFileSelect}
						className="hidden"
					/>
					<div className="w-12 h-12 bg-card rounded-full flex items-center justify-center mx-auto mb-4">
						<svg
							className="w-6 h-6 text-muted"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={1.5}
								d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
							/>
						</svg>
					</div>
					<p className="font-medium mb-1">
						{isDragging ? "Drop your file" : "Drop a text file here"}
					</p>
					<p className="text-sm text-muted">or click to browse</p>
				</div>
			) : (
				<form onSubmit={handleUrlSubmit} className="space-y-4">
					<input
						type="url"
						value={urlInput}
						onChange={(e) => setUrlInput(e.target.value)}
						placeholder="https://example.com/file.txt"
						className="w-full px-4 py-3 bg-card border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
					/>
					<button
						type="submit"
						disabled={!urlInput.trim() || isUploading}
						className="w-full py-3 bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
					>
						{isUploading ? "Creating..." : "Create MCP Server"}
					</button>
				</form>
			)}

			{isUploading && mode === "upload" && (
				<div className="text-center py-4">
					<div className="inline-flex items-center gap-2 text-muted">
						<svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
							<circle
								className="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								strokeWidth="4"
							/>
							<path
								className="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							/>
						</svg>
						Creating MCP Server...
					</div>
				</div>
			)}
		</div>
	);
}
