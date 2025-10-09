import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

async function testChatAPI() {
  console.log('Testing Chat API with category filter\n');

  const tests = [
    {
      message: 'ソリューションセールスについて教えてください',
      category: 'BtoB',
    },
    {
      message: 'マーケティングについて教えてください',
      category: 'BtoC',
    },
  ];

  for (const test of tests) {
    console.log('='.repeat(60));
    console.log(`Message: ${test.message}`);
    console.log(`Category: ${test.category}`);
    console.log('='.repeat(60));

    try {
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(test),
      });

      if (!response.ok) {
        console.error(`❌ HTTP Error: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error('Error details:', errorText);
        continue;
      }

      const data = await response.json();

      console.log('\n✅ Response received:');
      console.log('Success:', data.success);
      console.log('Has knowledge:', data.hasKnowledge);
      console.log('Answer length:', data.answer?.length || 0);
      console.log('Sources count:', data.sources?.length || 0);

      if (data.sources && data.sources.length > 0) {
        console.log('\nTop 3 sources:');
        data.sources.slice(0, 3).forEach((s: any, i: number) => {
          console.log(`${i + 1}. ${s.displayName} (similarity: ${s.similarity.toFixed(3)})`);
        });
      }

      console.log('\nAnswer preview:');
      console.log(data.answer?.substring(0, 200) + '...\n');
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : error);
    }
  }

  console.log('='.repeat(60));
  console.log('✅ Test completed');
  console.log('='.repeat(60));
}

testChatAPI();
