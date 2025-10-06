/**
 * チャットAPI（RAG統合）
 *
 * ユーザーの質問に対してRAGで回答を生成
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { generateEmbedding } from '@/lib/gemini';
import { env } from '@/lib/env';
import { getGenerationModel } from '@/lib/gemini-models';

interface KnowledgeMatch {
  id: string;
  content: string;
  context: string;
  metadata: Record<string, unknown>;
  similarity: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, category, maxResults = 5 } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    console.log('User question:', message);

    // 1. 質問を埋め込みベクトルに変換
    const queryEmbedding = await generateEmbedding(message);

    // 2. 類似チャンクを検索（多めに取得してフィルタリング）
    const supabase = getSupabaseAdmin();
    const { data: matches, error } = await supabase.rpc('match_knowledge', {
      query_embedding: queryEmbedding,
      match_threshold: 0.5,
      match_count: maxResults * 3, // 15件取得してフィルタ
    });

    if (error) {
      throw new Error(`Knowledge search failed: ${error.message}`);
    }

    // 3. セクション優先度でフィルタリング＆スコアリング
    const allMatches = (matches || []) as KnowledgeMatch[];
    const knowledgeMatches = rankAndFilterMatches(allMatches, maxResults);
    console.log(`Found ${knowledgeMatches.length} relevant chunks after filtering`);

    if (knowledgeMatches.length === 0) {
      return NextResponse.json({
        success: true,
        answer: '申し訳ございません。ご質問に関連する情報が見つかりませんでした。別の質問をお試しください。',
        sources: [],
        hasKnowledge: false,
      });
    }

    // 3. プロンプトを構築
    const prompt = buildPrompt(message, knowledgeMatches);

    // 4. Gemini APIで回答生成
    const answer = await generateAnswer(prompt);

    // 5. 参考ソース情報
    const sources = knowledgeMatches.map((match) => ({
      sheetName: match.metadata.sheetName,
      section: match.metadata.section,
      type: match.metadata.type,
      similarity: match.similarity,
      contentPreview: match.content.substring(0, 100) + '...',
    }));

    return NextResponse.json({
      success: true,
      answer,
      sources,
      hasKnowledge: true,
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * セクション優先度でマッチをランク付け＆フィルタ
 */
function rankAndFilterMatches(matches: KnowledgeMatch[], limit: number): KnowledgeMatch[] {
  // セクション優先度スコア
  const sectionPriority: Record<string, number> = {
    Intro: 1.5, // 導入は最も重要
    Lecture: 1.3, // 講義内容も重要
    Outro: 0.5, // まとめは優先度低
  };

  // タイプ優先度スコア
  const typePriority: Record<string, number> = {
    article: 1.2,
    description: 1.1,
    text: 1.0,
    survey: 0.8, // アンケートは優先度低
  };

  // 再スコアリング
  const scoredMatches = matches.map((match) => {
    const sectionBonus = sectionPriority[match.metadata.section as string] || 1.0;
    const typeBonus = typePriority[match.metadata.type as string] || 1.0;
    const adjustedScore = match.similarity * sectionBonus * typeBonus;

    return {
      ...match,
      adjustedScore,
    };
  });

  // 調整後スコアでソート
  scoredMatches.sort((a, b) => b.adjustedScore - a.adjustedScore);

  // 上位limit件を返す
  return scoredMatches.slice(0, limit);
}

/**
 * プロンプトを構築
 */
function buildPrompt(userQuestion: string, matches: KnowledgeMatch[]): string {
  const knowledgeContext = matches
    .map(
      (match, index) => `
【参考情報${index + 1}】（類似度: ${(match.similarity * 100).toFixed(1)}%）
${match.content}
`
    )
    .join('\n');

  return `あなたはマーケティング知識に精通した教育アシスタントです。
以下の【参考情報】は、マーケティング学習プログラムから抽出された複数の断片的な情報です。
これらを**総合的に解釈・統合**して、ユーザーの【質問】に対してわかりやすい回答を提供してください。

【重要なルール】
1. **情報の統合**:
   - 複数の参考情報から共通点やパターンを見つけて統合してください
   - 断片的な情報でも、文脈から全体像を推測して説明してください
   - 各情報が示唆している概念や考え方を読み取ってください

2. **回答の構成**:
   - 直接的な定義がなくても、参考情報から導き出せる本質を説明してください
   - 具体例や関連概念を使って理解を助けてください
   - 初学者にもわかるよう、段階的に説明してください

3. **情報の範囲**:
   - 参考情報に全く関連がない質問の場合のみ「提供された情報では回答できません」と答えてください
   - 部分的にでも関連する情報があれば、それを基に説明を構築してください

4. **フォーマット**:
   - マークダウン形式で読みやすく構成してください
   - 見出し、箇条書き、強調を適切に使用してください

${knowledgeContext}

【質問】
${userQuestion}

【回答】`;
}

/**
 * Gemini APIで回答を生成
 */
async function generateAnswer(prompt: string): Promise<string> {
  const apiKey = env.geminiApiKey;

  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  // 最適なモデルを自動選択
  const model = await getGenerationModel();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`Gemini API error: ${data.error.message}`);
  }

  const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!answer) {
    throw new Error('No answer generated from Gemini');
  }

  return answer;
}
