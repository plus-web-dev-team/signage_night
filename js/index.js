// 設定
const pages = ["ja.html", "en.html", "ch.html"];
let currentPageIndex = 0;
let isRotating = true;
let intervalId = null;
let countdownId = null;
let idleTimerId = null;
let secondsLeft = 10;
let controlsHidden = false;
let lastActivity = Date.now();
const isManualNavigation = false;
let contentInteractionEnabled = true;

// ページ読み込み時の初期化
window.onload = () => {
	console.log("ページ読み込み完了");

	// 初期状態をログに出力
	console.log(
		`コンテンツ操作モード: ${contentInteractionEnabled ? "有効" : "無効"}`,
	);

	// オーバーレイの設定
	setupOverlay();

	// クリックイベントの設定
	setupClickEvents();

	// 自動切り替えとアイドルタイマーを開始
	startRotation();
	startIdleTimer();

	// ユーザーのアクティビティを監視
	document.addEventListener("mousemove", resetIdleTimer);
	document.addEventListener("keypress", resetIdleTimer);
	document.addEventListener("click", resetIdleTimer);
	document.addEventListener("scroll", resetIdleTimer);

	// 間隔変更時の処理
	const intervalInput = document.getElementById("intervalInput");
	if (intervalInput) {
		intervalInput.addEventListener("change", () => {
			if (isRotating) {
				stopRotation();
				startRotation();
			}
		});
	}

	// アイドル時間変更時の処理
	const idleTimeInput = document.getElementById("idleTimeInput");
	if (idleTimeInput) {
		idleTimeInput.addEventListener("change", () => {
			resetIdleTimer();
		});
	}

	// コンテンツ操作トグルの初期状態を設定
	const checkbox = document.getElementById("contentInteractionToggle");
	if (checkbox) {
		checkbox.checked = contentInteractionEnabled;
	}
};

// クリックイベントの設定
function setupClickEvents() {
	// iframeラッパーでのクリックを検知
	const iframeWrapper = document.getElementById("iframeWrapper");
	if (iframeWrapper) {
		iframeWrapper.addEventListener("click", function (e) {
			// もしクリックがコントロールパネル上でなければ
			if (!e.target.closest("#controls")) {
				handleIframeWrapperClick(e);
			}
		});
	}

	// iframe内のクリックを検知するための別のアプローチ
	window.addEventListener("message", function (event) {
		if (event.data === "iframeClicked") {
			// iframe内でのクリックを検知
			if (isRotating) {
				toggleRotation();
				showStatusMessage(
					"iframeコンテンツがクリックされました - 自動切り替えは一時停止中",
				);
			}
			resetIdleTimer();
		}
	});
}

// 画面全体のオーバーレイを設定
function setupOverlay() {
	const overlay = document.getElementById("interactionOverlay");
	if (!overlay) {
		console.warn("interactionOverlay要素が見つかりません");
		return;
	}

	// 既存のイベントリスナーをクリア
	overlay.replaceWith(overlay.cloneNode(true));

	// 新しいオーバーレイ要素を取得
	const newOverlay = document.getElementById("interactionOverlay");

	// 新しいイベントリスナーを追加
	newOverlay.addEventListener("click", handleOverlayClick);

	// コンテンツ操作モードに基づいて表示・非表示を設定
	updateOverlayVisibility();
}

// オーバーレイの表示状態を更新
function updateOverlayVisibility() {
	const overlay = document.getElementById("interactionOverlay");
	if (!overlay) return;

	if (contentInteractionEnabled) {
		overlay.style.display = "none";
		console.log(
			"コンテンツ操作モードが有効です - オーバーレイを非表示にしました",
		);
	} else {
		overlay.style.display = "block";
		console.log("表示モードが有効です - オーバーレイを表示しました");
	}
}

// オーバーレイクリック時の処理
function handleOverlayClick(e) {
	console.log("オーバーレイがクリックされました");

	// デフォルトの動作を停止
	e.preventDefault();
	e.stopPropagation();

	// 自動切り替え中ならば一時停止
	if (isRotating) {
		toggleRotation();
		showStatusMessage("画面クリックを検知 - 自動切り替えは一時停止中");
	}

	// アイドルタイマーをリセット
	resetIdleTimer();
}

// iframeラッパーのクリックハンドラ
function handleIframeWrapperClick(e) {
	console.log("iframeラッパーがクリックされました");

	// コントロールパネル内のクリックは無視
	if (e.target.closest("#controls")) {
		return;
	}

	// コンテンツ操作モードが無効の場合のみイベントを処理
	if (!contentInteractionEnabled) {
		// デフォルトのイベント処理を停止
		e.preventDefault();
		e.stopPropagation();

		// 自動切り替え中ならば一時停止
		if (isRotating) {
			toggleRotation();
			showStatusMessage("画面クリックを検知 - 自動切り替えは一時停止中");
		}

		// アイドルタイマーをリセット
		resetIdleTimer();
	} else {
		// コンテンツ操作モードの場合でも、自動切り替えを停止する
		if (isRotating) {
			toggleRotation();
			showStatusMessage("コンテンツ操作中 - 自動切り替えは一時停止中");
		}

		// アイドルタイマーをリセット
		resetIdleTimer();
	}
}

// コンテンツ操作の有効/無効を切り替え
function toggleContentInteraction() {
	const checkbox = document.getElementById("contentInteractionToggle");
	if (!checkbox) {
		console.warn("contentInteractionToggle要素が見つかりません");
		return;
	}

	contentInteractionEnabled = checkbox.checked;
	updateOverlayVisibility();

	// 状態変更をユーザーに通知
	if (contentInteractionEnabled) {
		showStatusMessage(
			"コンテンツ操作モード有効 - リンククリックが可能になりました",
		);
	} else {
		showStatusMessage("表示モード有効 - 画面クリックで一時停止できます");
	}
}

// ステータスメッセージを表示
function showStatusMessage(message, duration = 3000) {
	const statusElement = document.getElementById("statusMessage");
	if (!statusElement) {
		console.warn("statusMessage要素が見つかりません");
		return;
	}

	statusElement.textContent = message;
	statusElement.style.display = "block";

	// 既存のタイマーをクリア
	if (statusElement.hideTimer) {
		clearTimeout(statusElement.hideTimer);
	}

	// 新しいタイマーを設定
	statusElement.hideTimer = setTimeout(() => {
		statusElement.style.display = "none";
	}, duration);
}

// アイドル時間タイマーをリセット
function resetIdleTimer() {
	lastActivity = Date.now();

	// 既存のタイマーをクリア
	if (idleTimerId) {
		clearTimeout(idleTimerId);
	}

	// 自動切り替えがオフの場合はアイドルタイマーを開始
	if (!isRotating) {
		startIdleTimer();
	}
}

// アイドルタイマーを開始
function startIdleTimer() {
	const idleTimeInput = document.getElementById("idleTimeInput");
	if (!idleTimeInput) {
		console.warn("idleTimeInput要素が見つかりません");
		return;
	}

	const idleTime = Number.parseInt(idleTimeInput.value) * 1000;

	idleTimerId = setTimeout(() => {
		// アイドル状態が検出されたとき
		if (!isRotating) {
			toggleRotation(); // 自動切り替えを再開
			showStatusMessage("アイドル状態検出 - 自動ページ切り替えを再開");
		}
	}, idleTime);
}

// ページ切り替え
function changePage(page) {
	const iframe = document.getElementById("pageFrame");
	if (!iframe) {
		console.warn("pageFrame要素が見つかりません");
		return;
	}

	console.log(`ページ切り替え: ${page}`);
	iframe.src = page;
	currentPageIndex = pages.indexOf(page);
}

// 次のページへ
function nextPage() {
	currentPageIndex = (currentPageIndex + 1) % pages.length;
	changePage(pages[currentPageIndex]);
}

// 自動切り替え開始
function startRotation() {
	const intervalInput = document.getElementById("intervalInput");
	if (!intervalInput) {
		console.warn("intervalInput要素が見つかりません");
		return;
	}

	let interval = Number.parseInt(intervalInput.value) * 1000;
	if (interval < 1000) interval = 1000; // 最低1秒

	secondsLeft = interval / 1000;

	// タイマー更新
	updateTimer();
	countdownId = setInterval(updateTimer, 1000);

	// ページ切り替え
	intervalId = setInterval(() => {
		nextPage();
		secondsLeft = interval / 1000;
	}, interval);

	const toggleBtn = document.getElementById("toggleBtn");
	if (toggleBtn) {
		toggleBtn.textContent = "一時停止";
	}

	isRotating = true;
	console.log("自動切り替え: 開始");
}

// 自動切り替え停止
function stopRotation() {
	clearInterval(intervalId);
	clearInterval(countdownId);
	intervalId = null;
	countdownId = null;

	const toggleBtn = document.getElementById("toggleBtn");
	if (toggleBtn) {
		toggleBtn.textContent = "再開";
	}

	isRotating = false;
	console.log("自動切り替え: 停止");
}

// 自動切り替えの開始/停止
function toggleRotation() {
	if (isRotating) {
		stopRotation();
	} else {
		startRotation();
	}
}

// タイマー表示の更新
function updateTimer() {
	const timerElement = document.getElementById("timer");
	if (!timerElement) {
		console.warn("timer要素が見つかりません");
		return;
	}

	timerElement.textContent = `次の切り替えまで: ${secondsLeft}秒`;
	secondsLeft--;

	if (secondsLeft < 0) {
		const intervalInput = document.getElementById("intervalInput");
		if (intervalInput) {
			secondsLeft = Number.parseInt(intervalInput.value);
		} else {
			secondsLeft = 60; // デフォルト値
		}
	}
}

// コントロールパネル表示/非表示
function toggleControls() {
	const controls = document.getElementById("controls");
	if (!controls) {
		console.warn("controls要素が見つかりません");
		return;
	}

	if (controlsHidden) {
		controls.style.width = "auto";
		controls.style.height = "auto";
		controls.innerHTML = `
      <div class="control-row">
        <button id="toggleBtn" onclick="toggleRotation()">${
					isRotating ? "一時停止" : "再開"
				}</button>
        <span id="timer">次の切り替えまで: ${secondsLeft}秒</span>
      </div>
      <div class="control-row">
        <button onclick="changePage('ja.html')">日本語</button>
        <button onclick="changePage('en.html')">英語</button>
        <button onclick="changePage('ch.html')">中国語</button>
      </div>
      <div class="control-row">
        <label for="intervalInput">切り替え間隔 (秒): </label>
        <input type="number" id="intervalInput" min="1" value="${
					document.getElementById("intervalInput")
						? document.getElementById("intervalInput").value
						: 60
				}" style="width: 60px;">
      </div>
      <div class="control-row">
        <label for="idleTimeInput">アイドル時間 (秒): </label>
        <input type="number" id="idleTimeInput" min="5" value="${
					document.getElementById("idleTimeInput")
						? document.getElementById("idleTimeInput").value
						: 30
				}" style="width: 60px;">
      </div>
      <div class="control-row">
        <button onclick="toggleControls()">コントロールを隠す</button>
      </div>
      <div class="control-row">
        <label>
          <input type="checkbox" id="contentInteractionToggle" onclick="toggleContentInteraction()" ${
						contentInteractionEnabled ? "checked" : ""
					}>
          コンテンツ操作を有効にする
        </label>
      </div>
    `;

		// 新しく作成された要素に対してイベントリスナーを再設定
		const intervalInput = document.getElementById("intervalInput");
		if (intervalInput) {
			intervalInput.addEventListener("change", () => {
				if (isRotating) {
					stopRotation();
					startRotation();
				}
			});
		}

		const idleTimeInput = document.getElementById("idleTimeInput");
		if (idleTimeInput) {
			idleTimeInput.addEventListener("change", () => {
				resetIdleTimer();
			});
		}

		// チェックボックスの状態を復元
		const checkbox = document.getElementById("contentInteractionToggle");
		if (checkbox) {
			checkbox.checked = contentInteractionEnabled;
		}
	} else {
		controls.innerHTML =
			'<button onclick="toggleControls()">コントロールを表示</button>';
	}
	controlsHidden = !controlsHidden;
}
