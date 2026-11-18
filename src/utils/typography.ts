/** Bind short English/Russian function words to the following word, preserving markup. */
export function keepShortWords(html: string): string {
  return html.replace(/(<[^>]*>)|([^<]+)/g, (part, tag, text: string) => {
    if (tag) return part;
    return text.replace(
      /(?<![\p{L}\p{N}_&])(a|an|the|and|or|but|as|at|by|for|from|in|of|on|to|with|и|а|в|во|к|ко|с|со|о|об|от|до|из|за|на|не|ни|по|под|при|у)[ \t\r\n]+(?=\S)/giu,
      "$1\u00a0",
    );
  });
}
