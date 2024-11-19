
// Firebaseのモジュールをインポート
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getFirestore, collection, updateDoc, getDoc, doc, getDocs, setDoc,  query, where } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

// Firebaseの設定 (Firebase Consoleで取得した値に置き換えてください)
const firebaseConfig = {
    apiKey: "AIzaSyA7kATZAWIf6SrL2pEhk-STMnmK3q3t-rE",
    authDomain: "bookindex-55f18.firebaseapp.com",
    databaseURL: "https://bookindex-55f18-default-rtdb.firebaseio.com",
    projectId: "bookindex-55f18",
    storageBucket: "bookindex-55f18.firebasestorage.app",
    messagingSenderId: "767766531773",
    appId: "1:767766531773:web:abb8494e48e50f70dcb1d4",
    measurementId: "G-8RH7W5Z7JP"
};

// Firebaseアプリを初期化
const app = initializeApp(firebaseConfig);

// Firestoreを初期化
const db = getFirestore(app);
console.log("Firestoreの初期化が完了しました！");


// Firestoreから候補を取得
async function fetchPredictions(inputText) {
    try {
        const colRef = collection(db, "booksArray");
        
        // 前方一致クエリを作成
        const q = query(
            colRef,
            where("title", ">=", inputText),
            where("title", "<=", inputText + "\uf8ff")
        );

        // Firestoreクエリを実行
        const querySnapshot = await getDocs(q);

        // 候補リストを作成
        const predictions = [];
        querySnapshot.forEach((doc) => {
            predictions.push(doc.data().title);
        });

        return predictions;
    } catch (error) {
        console.error("予測変換の取得中にエラーが発生しました:", error);
        return [];
    }
}

// 入力イベントに基づいて候補を表示
async function handleInputEvent(event) {
    const inputText = event.target.value.trim(); // 入力テキストを取得
    const suggestionsContainer = document.getElementById("suggestionsList");

    // 入力が空の場合、候補リストをクリア
    if (!inputText) {
        suggestionsContainer.innerHTML = "";
        return;
    }

    // 候補を取得
    const predictions = await fetchPredictions(inputText);

    // 候補を表示
    suggestionsContainer.innerHTML = ""; // 既存の候補をクリア
    predictions.forEach((title) => {
        const li = document.createElement("li");
        li.textContent = title;
        li.className = "suggestion-item";

        // 候補をクリックしたら入力ボックスに反映
        li.addEventListener("click", () => {
            document.getElementById("searchInput").value = title;
            suggestionsContainer.innerHTML = ""; // 候補リストをクリア
        });

        suggestionsContainer.appendChild(li);
    });
}

// 入力フィールドのイベントを設定
document.getElementById("searchInput").addEventListener("input", handleInputEvent);

// Firestoreで部分一致検索
async function searchBooks(searchTerm) {
    try {
        // コレクション参照
        const colRef = collection(db, "booksArray");

        // 前方一致検索用クエリ（FirestoreはstartAt/endAtをサポート）
        const q = query(colRef, where("title", ">=", searchTerm), where("title", "<=", searchTerm + "\uf8ff"));

        // クエリを実行
        const querySnapshot = await getDocs(q);

        // 結果を保存する配列
        const results = [];

        // クエリ結果を処理
        querySnapshot.forEach((doc) => {
            results.push({
                id: doc.id,
                ...doc.data(),
            });
        });

        // 検索結果を表示
        console.log("検索結果:", results);

        // 結果をHTMLに表示する
        const resultsContainer = document.getElementById("searchResults");
        resultsContainer.innerHTML = ""; // 既存の結果をクリア
        if (results.length > 0) {
            const ul = document.createElement("ul"); // リスト要素を作成
            ul.className = "results-list";

            results.forEach((book) => {
                const li = document.createElement("li");
                li.className = "result-item";

                // 在庫の状態をチェックして表示内容を決定
                const isAvailable = book.BorrowBook_Flag === true || book.BorrowBook_Flag === false;
                li.innerHTML = `
                    ${book.title} &nbsp; 
                    <strong>${isAvailable ? "在庫あり" : "在庫なし"}</strong>
                `;

                ul.appendChild(li);
            });
            resultsContainer.appendChild(ul);
        } else {
            resultsContainer.innerHTML = "<p>該当する本は見つかりませんでした。</p>";
        }
    } catch (error) {
        console.error("検索中にエラーが発生しました:", error);
        alert("検索中にエラーが発生しました。");
    }
}

// 検索ボタンにイベントリスナーを追加
document.getElementById("searchBtn").addEventListener("click", () => {
    const searchTerm = document.getElementById("searchInput").value.trim();
    if (searchTerm) {
        searchBooks(searchTerm);
    } else {
        alert("検索キーワードを入力してください！");
    }
});


// Firebaseでデータを更新する関数
async function updateDates(docId, newBorrowedDate, newReturnDate) {
    try {
        // 更新対象のドキュメントを指定
        const docRef = doc(db, "booksArray", docId);

        // 更新内容を設定
        await updateDoc(docRef, {
            borrowedDate: newBorrowedDate,
            returnDate: newReturnDate,
        });

        console.log("データを更新しました！");
        alert("本の貸出日と返却日を更新しました！");
    } catch (error) {
        console.error("データ更新中にエラーが発生しました:", error);
        alert("更新中にエラーが発生しました。もう一度試してください！");
    }
}

// 更新ボタンのクリックイベントを登録
document.getElementById("updateBtn").addEventListener("click", () => {
    const docId = document.getElementById("docIdInput").value; // 更新するドキュメントID
    const newBorrowedDate = document.getElementById("borrowedDateInput").value; // 新しい貸出日
    const newReturnDate = document.getElementById("returnDateInput").value; // 新しい返却日

    if (docId && newBorrowedDate && newReturnDate) {
        updateDates(docId, newBorrowedDate, newReturnDate); // 更新処理を実行
    } else {
        alert("すべてのフィールドを入力してください！");
    }
});

// Firestoreからデータを呼び出し、HTMLに反映する
async function getData() {
    try {
        const docRef = doc(db, "booksArray", "key1"); // ドキュメントIDを指定
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            console.log("データを取得しました:", docSnap.data());

            // データをHTMLに追加
            const bookList = document.getElementById("bookList");
            const bookData = docSnap.data();

            const newItem = document.createElement("div");
            newItem.className = "list";
            newItem.innerHTML = `
                <div class="item-box">
                    <div class="items1">
                        <div class="item">${bookData.no || "N/A"}</div>
                    </div>
                    <div class="items2">
                        <div class="item">${bookData.title || "タイトル不明"}</div>
                    </div>
                    <div class="items2">
                        <div class="item">${bookData.author || "著者不明"}</div>
                    </div>
                    <div class="items2">
                        <div class="item">${bookData.borrowedDate || "未設定"}</div>
                    </div>
                    <div class="items2">
                        <div class="item">${bookData.returnDate || "未設定"}</div>
                    </div>
                </div>
                <button class="item-btn">本を返す</button>
            `;
            bookList.appendChild(newItem);
        } else {
            console.log("指定されたドキュメントは存在しません！");
        }
    } catch (error) {
        console.error("データ取得中にエラーが発生しました:", error);
    }
}

// 呼び出しボタンのクリックイベントを登録
document.querySelector(".btn-area button").addEventListener("click", getData);


// モーダル関連の操作
const modal = document.getElementById("addBookModal");
const showModalBtn = document.getElementById("showModalBtn");
const closeModalBtn = document.querySelector(".close");

// モーダルを表示する
showModalBtn.addEventListener("click", () => {
    modal.style.display = "block";
});

// モーダルを閉じる
closeModalBtn.addEventListener("click", () => {
    modal.style.display = "none";
});

// モーダル外をクリックしたときに閉じる
window.addEventListener("click", (event) => {
    if (event.target === modal) {
        modal.style.display = "none";
    }
});

// 新しい本を追加する関数
async function addNewBook() {
    try {
        // コレクション参照
        const colRef = collection(db, "booksArray");
        
        // コレクション内のドキュメントをすべて取得
        const snapshot = await getDocs(colRef);
        const docCount = snapshot.size; // 現在のドキュメント数

        // 新しいkeyとnoを生成
        const newKey = `key${docCount + 1}`;
        const newNo = docCount + 1;

        // ユーザーが入力したデータを取得
        const title = document.getElementById("newTitle").value;
        const author = document.getElementById("newAuthor").value;

        // 必要なフィールドが入力されているか確認
        if (!title || !author || !borrowedDate || !returnDate) {
            alert("すべてのフィールドを入力してください！");
            return;
        }

        // 新しいドキュメントを追加
        await setDoc(doc(db, "booksArray", newKey), {
            no: newNo,
            title,
            author,
            borrowedDate: "",
            returnDate: "",
            BorrowBook_Flag: true,
        });

        console.log(`新しいドキュメントを追加しました！key: ${newKey}`);
        alert(`新しいドキュメントを追加しました！key: ${newKey}`);

        // モーダルを閉じる
        modal.style.display = "none";

        // 入力フィールドをリセット
        document.getElementById("newTitle").value = "";
        document.getElementById("newAuthor").value = "";
        document.getElementById("newBorrowedDate").value = "";
        document.getElementById("newReturnDate").value = "";
    } catch (error) {
        console.error("ドキュメント追加中にエラーが発生しました:", error);
        alert("ドキュメント追加中にエラーが発生しました。もう一度試してください！");
    }
}

// 「本を追加」ボタンのイベント
document.getElementById("addBookBtn").addEventListener("click", addNewBook);




// 本の内容をオブジェクトとして格納
const booksArray = {
    key1: {
        title: "時給300円の死神",
        author: "藤まる",
    },
    key2: {
        title: "夢を叶えるゾウ",
        author: "水野 敬也",
    },
    key3: {
        title: "ノルウェイの森",
        author: "村上 春樹",
    },
    key4: {
        title: "火花",
        author: "又吉 直樹",
    }
};

// 『本を借りる』ボタンで配列内の本の情報をランダムで取得して一覧に追加する。
function BookInfoAdd() {

    // booksArrayからランダムに本を取得
    const keys = Object.keys(booksArray); // オブジェクトのキーを取得
    const randomKey = keys[Math.floor(Math.random() * keys.length)]; // ランダムなキーを取得
    const randomBook = booksArray[randomKey]; // ランダムな本の情報

    // タイトル名と著者名を取得
    const title = randomBook.title
    const author = randomBook.author

    // 本を借りた日を設定
    const today = new Date();
    const checkoutBook = formatDate(today); // フォーマットに合わせて表示
    console.log(checkoutBook);

    // 本を返す日を設定
    const returnBook = formatDate(DaysLater(today, 5));
    console.log(returnBook);

    // それぞれ
    BookAdd(title,author,checkoutBook,returnBook)

    // リスト項目を作成して追加
    const listItem = document.createElement('li');
    listItem.textContent = `${randomBook.title} - 著者: ${randomBook.author}`;
    bookList.appendChild(listItem); // リストに追加
} 

// 日付を "yyyy/mm/dd" 形式でフォーマットする
function formatDate(date) {

    // 年、月、日にち、曜日を設定
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // 月は0から始まるため+1し、2桁に揃える
    const day = String(date.getDate()).padStart(2, '0'); // 日を2桁に揃える
    const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
    const dayOfWeek = weekdays[date.getDay()]; // 曜日を取得

    // 戻り値として返す
    return `${year}/${month}/${day}(${dayOfWeek})`;
}

// 営業日の計算
function DaysLater(startDate, days) {

    let date = new Date(startDate); // 開始日を基準に新しいDateオブジェクトを作成
    let addedDays = 0;

    // 営業日を日数分カウントする
    while (addedDays < days) {
        date.setDate(date.getDate() + 1); // 日付を1日進める

        // 土日以外であれば営業日としてカウント
        if (date.getDay() !== 0 && date.getDay() !== 6) {
            addedDays++;
        }
    }

    // 戻り値として返す
    return date;
}

// 要素の追加
function BookAdd(book_title,book_author,book_checkout,book_return) {

    // 新しい<div>要素を作成して、クラスを追加
    const newDiv = document.createElement('div');
    newDiv.classList.add('list'); 

    // 新しい<div>要素を作成して、クラスを追加
    const newItemBox = document.createElement('div');
    newItemBox.classList.add('item-box'); 
    newItemBox.classList.add('box1'); 

    // 新しい<div>要素を作成して、クラスを追加
    const newItems1 = document.createElement('div');
    newItems1.classList.add('items1'); 

    // 新しい<div>要素を作成して、クラスを追加(No)
    const newInfo1 = document.createElement('div');
    newInfo1.classList.add('item'); 

    // 全てのBookNoをオブジェクトとして取得
    const bookNo = document.querySelectorAll('.book-No');

    // LastNoを最後のBookNoオブジェクトとして定義
    const lastBookNo = bookNo[bookNo.length - 1];
    const lastNo = lastBookNo.textContent;

    // No(lastNoに+1した値)を作成
    newInfo1.textContent = lastNo + 1;
    console.log(newInfo1.textContent)

    // newItems1内に要素を追加する
    newItems1.appendChild(newInfo1)
    newItemBox.appendChild(newItems1);

    // 新しい配列を定義して、要素を作成後、クラスを追加する
    const ArrayItem = [book_title,book_author,book_checkout,book_return];
    for (let i = 0; i < ArrayItem.length; i++) {

        // 新しい<div>要素を作成して、クラスを追加
        const newItems2 = document.createElement('div');
        newItems2.classList.add('items2'); 

        // 新しい<div>要素を作成して、クラスを追加
        const newInfo2 = document.createElement('div');
        newInfo2.classList.add('item'); 

        // 繰り返したい処理をここに記述
        console.log(`ループ回数: ${i}`);
    
        // 要素内に値を追加する
        newInfo2.textContent = ArrayItem[i];
        console.log(ArrayItem[i])

        // newItems2内に要素を追加する
        newItems2.appendChild(newInfo2)
        newItemBox.appendChild(newItems2);
    }

    // ボタンの要素を追加
    const btn = document.createElement('button');
    btn.classList.add('item-btn'); 
    btn.textContent = '本を返す';

    // 上記の要素をすべて統合
    newDiv.appendChild(newItemBox);
    newDiv.appendChild(btn);

    // 一覧に新しい本の情報を追加
    document.querySelector('.contents-area').appendChild(newDiv);
}
