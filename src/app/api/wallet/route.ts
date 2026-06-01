import { NextRequest, NextResponse } from "next/server";

const BASE_API = "https://base.blockscout.com/api";
const TWITTER_TOKEN = process.env.TWITTER_BEARER_TOKEN || "";

const KNOWN_PROTOCOLS: Record<string, { name: string; icon: string }> = {
  "0x6cd828e1f9781786108b7d45b6d384728db0cc5e": { name: "Aerodrome", icon: "A" },
  "0x198ef79f1fe5156ac1fd20f7a582f50f64e4e2c0": { name: "Uniswap", icon: "U" },
  "0x2626664c2603336e57b271c5c0b26f421741e481": { name: "Uniswap V3", icon: "U" },
  "0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24": { name: "Morpho", icon: "M" },
  "0xa238dd80c259a72e81d7e4664a9801593f98d1c5": { name: "Aave V3", icon: "A" },
  "0x859bab3160ac1820e85e449d9e2189a2ff29d6c8": { name: "Moonwell", icon: "M" },
  "0xf7a0dd3317535ec4f4d29adf9d620b3d8d5d5069": { name: "Alien Base", icon: "AB" },
  "0xaaa2b49836edd05c5ea7af28a0b6e4686562ce51": { name: "BaseSwap", icon: "BS" },
  "0xbe6d8f0d05c46a24e1753572508800e6136a5f1a": { name: "Maverick", icon: "MV" },
  "0x0cec5083b14d841e3a4ace0204e2e5e714fb0cf5": { name: "SushiSwap", icon: "S" },
  "0x6b5da9788a6c0f6595685a95b67dad6a75fa15e7": { name: "Odos", icon: "O" },
  "0xd82e10b9a4107939e55f292a2801a2efb2a5f30b": { name: "Compound V3", icon: "C" },
  "0x4200000000000000000000000000000000000006": { name: "WETH", icon: "W" },
  "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913": { name: "USDC", icon: "U" },
  "0x50c5725949a6f0c72e6c4a641f24049a917db0cb": { name: "DAI", icon: "D" },
};

async function fetchAPI(path: string) {
  const r = await fetch(BASE_API + path);
  const d = await r.json();
  return d;
}

async function fetchAllPages(module: string, action: string, address: string) {
  const all: any[] = [];
  for (let page = 1; page <= 200; page++) {
    const d = await fetchAPI(
      `?module=${module}&action=${action}&address=${address}&startblock=0&endblock=99999999&sort=desc&offset=50&page=${page}`
    );
    if (!d.result?.length) break;
    all.push(...d.result);
    if (d.result.length < 50) break;
  }
  return all;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const addr = searchParams.get("addr")?.toLowerCase();
  const twitter = searchParams.get("twitter");

  if (!addr || addr.length !== 42 || !addr.startsWith("0x")) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  try {
    const [txs, tokens, balanceData] = await Promise.all([
      fetchAllPages("account", "txlist", addr),
      fetchAllPages("account", "tokentx", addr),
      fetchAPI(`?module=account&action=balance&address=${addr}&tag=latest`),
    ]);

    const outTx = txs.filter((t: any) => t.from?.toLowerCase() === addr);
    const totalTx = txs.length;
    const totalVolEth = outTx.reduce((s: number, t: any) => s + parseInt(t.value || "0"), 0) / 1e18;
    const balEth = parseInt(balanceData.result || "0") / 1e18;

    const months = new Set<string>();
    outTx.forEach((t: any) => {
      if (t.timeStamp) {
        const d = new Date(parseInt(t.timeStamp) * 1000);
        months.add(d.getFullYear() + "-" + d.getMonth());
      }
    });

    const contracts = new Set(
      outTx.filter((t: any) => t.input && t.input !== "0x" && t.to).map((t: any) => t.to.toLowerCase())
    );

    const protocolMap: Record<string, number> = {};
    const protocolDetails: { name: string; icon: string; txCount: number }[] = [];
    contracts.forEach((c) => {
      const p = KNOWN_PROTOCOLS[c] || null;
      const name = p?.name || "Other";
      protocolMap[name] = (protocolMap[name] || 0) + 1;
    });

    Object.entries(protocolMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .forEach(([name, count]) => {
        protocolDetails.push({ name, icon: name[0], txCount: count });
      });

    const uniqueTokens = new Set(tokens.map((t: any) => t.contractAddress));
    const tokenList = tokens
      .filter((t: any) => t.tokenSymbol)
      .slice(0, 20)
      .map((t: any) => ({
        symbol: t.tokenSymbol,
        name: t.tokenName || t.tokenSymbol,
        address: t.contractAddress,
      }));

    const firstTxTs = txs.length ? parseInt(txs[txs.length - 1].timeStamp) : null;
    const ageDays = firstTxTs ? Math.floor((Date.now() / 1000 - firstTxTs) / 86400) : 0;

    let twitterMetrics = null;
    if (twitter && TWITTER_TOKEN) {
      try {
        const userR = await fetch(
          `https://api.twitter.com/2/users/by/username/${twitter.replace(/^@/, "")}`,
          { headers: { Authorization: `Bearer ${TWITTER_TOKEN}` } }
        );
        const userD = await userR.json();
        if (userD.data?.id) {
          const mR = await fetch(
            `https://api.twitter.com/2/users/${userD.data.id}?user.fields=public_metrics`,
            { headers: { Authorization: `Bearer ${TWITTER_TOKEN}` } }
          );
          twitterMetrics = (await mR.json()).data?.public_metrics || null;
        }
      } catch {}
    }

    return NextResponse.json({
      address: addr,
      stats: {
        totalTx,
        activeMonths: months.size,
        uniqueContracts: contracts.size,
        totalVolEth,
        balEth,
        uniqueTokens: uniqueTokens.size,
        ageDays,
      },
      protocols: protocolDetails,
      tokens: tokenList,
      twitterMetrics,
      recentTxs: txs.slice(0, 25).map((t: any) => ({
        hash: t.hash,
        from: t.from,
        to: t.to,
        value: (parseInt(t.value || "0") / 1e18).toFixed(4),
        timeStamp: t.timeStamp,
        isContract: t.from?.toLowerCase() === addr && t.input && t.input !== "0x",
      })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
