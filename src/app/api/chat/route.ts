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

    // 5. 参考ソース情報（学習者向けに整形）
    const sources = knowledgeMatches.map((match) => ({
      displayName: formatSourceName(match),
      similarity: match.similarity,
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
 * 参考ソース名を学習者向けに整形
 */
function formatSourceName(match: KnowledgeMatch): string {
  const sheetName = match.metadata.sheetName as string;
  const section = match.metadata.section as string;
  const category = match.metadata.category as string;

  // シート名からチャプター番号を抽出（例: M6CH01001 -> Chapter 1-1）
  const chapterMatch = sheetName.match(/([MB])6CH(\d{2})(\d{3})/);
  if (chapterMatch) {
    const [, prefix, chapter, lesson] = chapterMatch;
    const categoryLabel = prefix === 'M' ? 'BtoC' : 'BtoB';
    const chapterNum = parseInt(chapter, 10);
    const lessonNum = parseInt(lesson, 10);

    // セクション名を日本語に
    const sectionLabel = section === 'Intro' ? '導入' : section === 'Lecture' ? '講義' : 'まとめ';

    return `${categoryLabel} Chapter ${chapterNum}-${lessonNum} - ${sectionLabel}`;
  }

  // フォールバック
  return `${category} - ${section}`;
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
以下の【参考情報】を基に、ユーザーの【質問】に簡潔に回答してください。

【重要なルール】
1. **簡潔性**: 回答は最大300文字以内で、要点を端的に説明してください
2. **構成**: 「〜とは」の定義や「要するに」のポイントを中心に、シンプルに説明してください
3. **前置き禁止**: 「マーケティング学習プログラムから」「断片的な情報を総合すると」などの前置きは一切不要です。直接回答を開始してください
4. **情報源**: 参考情報に基づいて回答してください。情報がない場合のみ「提供された情報では回答できません」と答えてください

${knowledgeContext}

【質問】
${userQuestion}

【回答】（300文字以内で簡潔に）`;
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
        maxOutputTokens: 8192,
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
