document.addEventListener("DOMContentLoaded", function () {
	// 中国語メニューリンク
	const enLink = document.getElementById("enLink");
	const enAudio = document.getElementById("enAudio");

	// 日本語メニューリンク
	const chLink = document.getElementById("chLink");
	const chAudio = document.getElementById("chAudio");

	// クリックイベントリスナーを追加
	enLink.addEventListener("click", function (event) {
		// デフォルトの動作（リンク遷移）を一時的に停止
		event.preventDefault();

		// 音声再生
		enAudio.play();

		// 音声の再生が終了したらリンク先へ遷移
		enAudio.onended = function () {
			window.location.href = enLink.getAttribute("href");
		};
	});

	chLink.addEventListener("click", function (event) {
		event.preventDefault();
		chAudio.play();

		// 音声の再生が終了したらリンク先へ遷移
		chAudio.onended = function () {
			window.location.href = chLink.getAttribute("href");
		};
	});
});
