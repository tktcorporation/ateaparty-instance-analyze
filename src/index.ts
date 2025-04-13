import fs from 'fs';
import path from 'path';
/**
 * VRChatグループインスタンス情報取得スクリプト
 */
import { FetchError, ofetch } from 'ofetch';

// 現在の日時を取得（タイムゾーン情報を含む）
const currentDate = new Date();
const formattedDate = currentDate.toISOString().replace(/:/g, '-').replace(/\..+/, '');
// タイムゾーン情報を含むISO形式の日時（履歴のキーとして使用）
const dateTimeWithTZ = new Date().toISOString();

// 設定値の取得
const GROUP_ID = process.env.GROUP_ID || 'grp_e7e50ff7-a7b4-4645-8640-9292957b52fb';
const VRC_AUTH_TOKEN = process.env.VRC_AUTH_TOKEN || '';

// 出力ファイルのパス設定
const BASE_DIR = process.env.OUTPUT_BASE_DIR || process.cwd();
const logDir = path.join(BASE_DIR, 'logs');
const dataDir = path.join(BASE_DIR, 'data');

// 履歴ファイルのパス
// GitHubリポジトリで管理するためにdata/に保存
const HISTORY_FILE = process.env.HISTORY_FILE || 'instance-history.json';
const historyFilePath = path.join(dataDir, HISTORY_FILE);

// ディレクトリの作成
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// モックレスポンスデータ
const mockInstanceData = [
  {
    instanceId: '23067~group(grp_e7e50ff7-a7b4-4645-8640-9292957b52fb)~groupAccessType(plus)~region(jp)',
    location: 'wrld_8f7d823e-79a9-4b8f-9efa-c53deeb1d36c:23067~group(grp_e7e50ff7-a7b4-4645-8640-9292957b52fb)~groupAccessType(plus)~region(jp)',
    memberCount: 17,
    world: {
      authorId: 'usr_8ba035f6-63d7-436a-8e10-4587d380074d',
      authorName: 'Agog Admin',
      capacity: 60,
      created_at: '2024-08-08T19:29:13.619Z',
      defaultContentSettings: {},
      description: 'Welcome to Agog House‚ home of our Community Meetup․',
      favorites: 1577,
      featured: false,
      heat: 4,
      id: 'wrld_8f7d823e-79a9-4b8f-9efa-c53deeb1d36c',
      imageUrl: 'https://api.vrchat.cloud/api/1/file/file_c4ed712b-2d33-45d2-bd0d-e65eab81e3fb/4/file',
      labsPublicationDate: '2024-10-16T17:24:47.049Z',
      name: 'Agog House',
      organization: 'vrchat',
      popularity: 6,
      publicationDate: '2024-10-17T04:42:42.733Z',
      recommendedCapacity: 40,
      releaseStatus: 'public',
      tags: [
        'author_tag_agog',
        'author_tag_xr',
        'author_tag_impact',
        'system_approved',
      ],
      thumbnailImageUrl: 'https://api.vrchat.cloud/api/1/image/file_c4ed712b-2d33-45d2-bd0d-e65eab81e3fb/4/256',
      updated_at: '2025-03-25T20:16:54.164Z',
      visits: 24557,
    },
  },
];

/**
 * インスタンス情報を履歴ファイルに保存する
 * @param instances インスタンス情報
 * @param timestamp タイムスタンプ（キーとして使用）
 * @returns ファイルに変更があったかどうか（Gitコミット判断に使用）
 */
function saveInstanceHistory(instances: any[], timestamp: string): boolean {
  try {
    let history: Record<string, any> = {};
    let fileExisted = false;
    let fileChanged = true;  // デフォルトは変更ありとして扱う
    
    // 既存の履歴ファイルが存在する場合は読み込む
    if (fs.existsSync(historyFilePath)) {
      fileExisted = true;
      const historyData = fs.readFileSync(historyFilePath, 'utf8');
      try {
        history = JSON.parse(historyData);
        
        // 既に同じキーのデータが存在し、内容も同じ場合は更新しない
        if (history[timestamp] && JSON.stringify(history[timestamp]) === JSON.stringify(instances)) {
          console.log(`既に同じデータが存在します。キー: ${timestamp}`);
          fileChanged = false;
          return false;
        }
      } catch (error) {
        console.warn('履歴ファイルの解析に失敗しました。新しいファイルを作成します。');
      }
    }
    
    // 新しいデータを追加（タイムスタンプをキーとして使用）
    history[timestamp] = instances;
    
    // ファイルに保存
    fs.writeFileSync(historyFilePath, JSON.stringify(history, null, 2), 'utf8');
    
    if (fileExisted) {
      console.log(`インスタンス履歴を ${historyFilePath} に更新しました。日時キー: ${timestamp}`);
    } else {
      console.log(`インスタンス履歴を ${historyFilePath} に新規作成しました。日時キー: ${timestamp}`);
    }
    
    return fileChanged;
  } catch (error) {
    console.error('履歴ファイルの保存中にエラーが発生しました:', error);
    return false;
  }
}

/**
 * 日次履歴ファイルに保存する（日付ごとのファイルに最新データを保存）
 * @param instances インスタンス情報
 * @param groupId グループID
 * @returns ファイル変更があったかどうか
 */
function saveDailyHistory(instances: any[], groupId: string): boolean {
  try {
    // 今日の日付のみを取得（YYYY-MM-DD形式）
    const today = new Date().toISOString().split('T')[0];
    
    // 日次ファイルのパス
    const dailyFilePath = path.join(dataDir, `instances-${groupId}-${today}.json`);
    
    let fileExisted = false;
    let fileChanged = true;
    
    // 既存のファイルがある場合
    if (fs.existsSync(dailyFilePath)) {
      fileExisted = true;
      const existingData = fs.readFileSync(dailyFilePath, 'utf8');
      try {
        const existingInstances = JSON.parse(existingData);
        // 内容が同じ場合は更新しない
        if (JSON.stringify(existingInstances) === JSON.stringify(instances)) {
          console.log(`日次ファイル ${dailyFilePath} のデータに変更はありません。`);
          fileChanged = false;
          return false;
        }
      } catch (error) {
        console.warn('日次ファイルの解析に失敗しました。新しいファイルを作成します。');
      }
    }
    
    // ファイルに保存
    fs.writeFileSync(dailyFilePath, JSON.stringify(instances, null, 2), 'utf8');
    
    if (fileExisted) {
      console.log(`日次ファイル ${dailyFilePath} を更新しました。`);
    } else {
      console.log(`日次ファイル ${dailyFilePath} を新規作成しました。`);
    }
    
    return fileChanged;
  } catch (error) {
    console.error('日次ファイルの保存中にエラーが発生しました:', error);
    return false;
  }
}

/**
 * VRChatのAPIからグループインスタンス情報を取得する
 * @param groupId - 取得するグループのID
 * @returns ファイル変更フラグ
 */
async function fetchGroupInstances(groupId: string): Promise<boolean> {
  try {
    console.log(`${formattedDate}: グループ ${groupId} のインスタンス情報取得を開始します。`);

    // 認証情報の確認
    if (!VRC_AUTH_TOKEN) {
      console.warn('警告: 認証情報が設定されていません。多くのAPIエンドポイントでは認証が必要です。');
      console.warn('MOCK_RESPONSE=true を設定してモックデータを使用するか、有効な認証トークンを設定してください。');
      
      if (process.env.MOCK_RESPONSE !== 'true') {
        throw new Error('有効な認証トークンが必要です。VRC_AUTH_TOKENを設定してください。');
      }
    }

    let instances;
    // モックモードの確認
    if (process.env.MOCK_RESPONSE === 'true') {
      console.log('モックデータを使用します');
      instances = mockInstanceData;
    } else {
      // VRChatドメインとパスを設定
      const baseURL = process.env.VRCHAT_API_BASE_URL || 'https://vrchat.com';
      const apiEndpoint = process.env.VRCHAT_API_ENDPOINT || `/api/1/groups/${groupId}/instances`;
      const url = `${baseURL}${apiEndpoint}`;

      console.log(`APIリクエスト: ${url}`);

      // より完全なリクエストヘッダーセット
      const headers: Record<string, string> = {
        'Accept': '*/*',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
        'Content-Type': 'application/json',
        // 'User-Agent': 'AteapartyInstanceAnalyzer/1.0',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache',
      };

      // 認証情報がある場合のみCookieヘッダーを追加
      if (VRC_AUTH_TOKEN) {
        // 複数のCookieを設定できるようにする
        const extraCookies = process.env.VRCHAT_EXTRA_COOKIES || '';
        headers['Cookie'] = `auth=${VRC_AUTH_TOKEN}; ${extraCookies}`;
      }

      console.log('APIリクエスト送信中...');

      // タイムアウトを設定
      const timeout = parseInt(process.env.REQUEST_TIMEOUT || '30000', 10);
      
      // APIリクエスト送信
      instances = await ofetch(url, {
        method: 'GET',
        headers,
        timeout,
        retry: 1,
      });
      
      console.log('APIリクエスト成功');
    }

    // インスタンス数を表示
    console.log(`${instances.length}件のインスタンス情報を取得しました。`);

    // 結果をログファイルに保存（単発のログファイル）
    const logFilePath = path.join(logDir, `instances-${groupId}-${formattedDate}.json`);
    fs.writeFileSync(logFilePath, JSON.stringify(instances, null, 2), 'utf8');
    console.log(`ログを ${logFilePath} に保存しました。`);
    
    // 履歴ファイルに保存
    const historyChanged = saveInstanceHistory(instances, dateTimeWithTZ);
    
    // 日次ファイルに保存
    const dailyChanged = saveDailyHistory(instances, groupId);
    
    // 内容を表示
    console.log('\nインスタンス情報:');
    console.log(JSON.stringify(instances, null, 2));

    // ファイル変更があったかどうかを返す
    return historyChanged || dailyChanged;
  } catch (error: unknown) {
    console.error('エラーが発生しました:', error);

    if (error instanceof FetchError) {
      console.error('ステータスコード:', error.status);
      console.error('レスポンスデータ:', error.data);
      
      // 401エラーの場合は特別なメッセージを表示
      if (error.status === 401) {
        console.error('認証エラー: VRChatの認証トークンが無効または期限切れです。新しいトークンを取得して設定してください。');
        console.error('VRChatにログインして、ブラウザの開発者ツールでCookieから新しいauthトークンを取得してください。');
      }
    }

    throw error;
  }
}

/**
 * VRChatのAPIからワールド情報を取得する
 * @param worldId - 取得するワールドのID
 */
async function fetchWorldInfo(worldId: string) {
  try {
    console.log(`${formattedDate}: ワールド ${worldId} の情報取得を開始します。`);

    // 認証情報の確認
    if (!VRC_AUTH_TOKEN) {
      console.warn('警告: 認証情報が設定されていません。APIアクセスには認証が必要です。');
      throw new Error('有効な認証トークンが必要です。VRC_AUTH_TOKENを設定してください。');
    }

    // VRChatドメインとパスを設定
    const baseURL = process.env.VRCHAT_API_BASE_URL || 'https://vrchat.com';
    const url = `${baseURL}/api/1/worlds/${worldId}`;

    console.log(`APIリクエスト: ${url}`);

    // より完全なリクエストヘッダーセット
    const headers: Record<string, string> = {
      'Accept': '*/*',
      'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
      'Sec-Ch-Ua': '"Not A(Brand";v="99", "Google Chrome";v="134", "Chromium";v="134"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"macOS"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'Referer': `${baseURL}/home/world/${worldId}/info`,
      'Origin': baseURL,
      'Pragma': 'no-cache',
      'Cache-Control': 'no-cache',
    };

    // 認証情報がある場合のみCookieヘッダーを追加
    if (VRC_AUTH_TOKEN) {
      // 複数のCookieを設定できるようにする
      const extraCookies = process.env.VRCHAT_EXTRA_COOKIES || '';
      headers['Cookie'] = `auth=${VRC_AUTH_TOKEN}; ${extraCookies}`;
    }

    // APIリクエスト送信
    const worldInfo = await ofetch(url, {
      method: 'GET',
      headers,
      retry: 1,
    });

    console.log(`ワールド ${worldId} の情報を取得しました。`);
    return worldInfo;
  } catch (error: unknown) {
    console.error(`ワールド ${worldId} の情報取得中にエラーが発生しました:`, error);
    if (error instanceof FetchError) {
      console.error('ステータスコード:', error.status);
      console.error('レスポンスデータ:', error.data);
      
      // 401エラーの場合は特別なメッセージを表示
      if (error.status === 401) {
        console.error('認証エラー: VRChatの認証トークンが無効または期限切れです。新しいトークンを取得して設定してください。');
      }
    }
    throw error;
  }
}

// メイン処理
async function main() {
  try {
    // 環境変数からグループIDを取得
    const groupId = GROUP_ID;
    
    // インスタンス情報を取得
    const fileChanged = await fetchGroupInstances(groupId);
    
    // ファイル変更があった場合、環境変数をセット（GitHub Actionsで使用）
    if (fileChanged) {
      // GitHub Actionsでは、以下の構文で環境変数を設定できる
      // これにより、次のステップでコミットする際の条件として使える
      if (process.env.GITHUB_ACTIONS === 'true') {
        fs.appendFileSync(process.env.GITHUB_ENV || '', `FILE_CHANGED=true\n`);
        console.log('ファイル変更を検出: GitHub Actionsの環境変数 FILE_CHANGED=true を設定しました');
      }
    } else {
      console.log('ファイル変更なし: コミットは不要です');
    }
    
    console.log('処理が完了しました。');
  } catch (error: unknown) {
    console.error('スクリプト実行中にエラーが発生しました:', error);
    process.exit(1);
  }
}

// スクリプト実行
main();
