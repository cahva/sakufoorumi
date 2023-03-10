import TurndownService from "npm:turndown@7.1.1";

const td = new TurndownService();

export type Post = {
  id: number;
  time: number;
  authorName: string;
  authorEmail?: string;
  html: string;
  md: string;
};

type Level = {
  id: number;
  name: string;
};

export type Topic = {
  mainTopicId: number;
  mainTopic: string;
  me: string;
  meId: number;
  properties?: string;
  param?: string;
  parent: number;
  levels: Level[];
  announcement_html?: string;
  announcement_md?: string;
  description_html?: string;
  description_md?: string;
};

export type TopicDescription = {
  id: number;
  description_html: string;
  description_md: string;
}

function findPostById(id: number, posts: Post[]) {
  return posts.find((post) => post.id === id);
}

/**
 * board-topics.html contains top level descriptions. Each topic has the following format:
 * <!--Top: 2593-->
 * <tr bgcolor="#f5f5ff">
 * <td valign=top nowrap>
 * <img name="img2593" height=11 width=28 border=0 src="http://saku.bbs.fi/discus/icons/tree_j.gif" alt="">
 * <img src="http://saku.bbs.fi/discus/icons/tree_n.gif" height=16 width=20>
 * </td>
 * <td valign=top><font size="2" face="Verdana,Arial,Helvetica">
 * <a href="http://saku.bbs.fi/discus/messages/2593/2593.html?1677607098"><b>Yleinen keskustelu</b></a>
 * <br><font size=1><!--Descr-->Yleinen Amiga-maailmaan ja yhteensopiviin laitteisiin liittyv&auml; keskustelu.<!--/Descr--></font>
 * </td>
 * <td align=right valign=top nowrap><font size="2" face="Verdana,Arial,Helvetica">11467</font></td>
 * <td align=right valign=top nowrap><font size="2" face="Verdana,Arial,Helvetica">1025</font></td>
 * <td nowrap valign=top align=center><font size="2" face="Verdana,Arial,Helvetica">28. 2.2023 19:58</font></td>
 * <td align=left valign=top nowrap><font size="2" face="Verdana,Arial,Helvetica">jPV</font></td>
 * </tr>
 * <!--/Top-->
 * 
 * From these we will extract <!--Descr-->Descrtipion<!--/Descr-->
 */
const parseSubTopicsFromText = (text: string): TopicDescription[] => {
  const topics: TopicDescription[] = [];
  const topicRegex = /<!--Top: (\d+)-->(.|\s)*?<!--\/Top-->/g;
  let match = topicRegex.exec(text);
  while (match) {
    const topicId = parseInt(match[1]);
    const topicDescription = match[0].match(/<!--Descr-->(.|\s)*?<!--\/Descr-->/g);
    if (topicDescription) {
      const descriptionHtml = topicDescription[0].replace(/<!--Descr-->/g, "").replace(/<!--\/Descr-->/g, "");
      const descriptionMd = td.turndown(descriptionHtml);
      topics.push({
        id: topicId,
        description_html: descriptionHtml,
        description_md: descriptionMd,
      });
    }
    match = topicRegex.exec(text);
  }
  return topics;
};



/**
 * Parse html file for contents
 * HTML file contains html comments with the following format:
 * <!--Topic: 3/Classic Amiga--> # Top level topic id/name
 * <!--Me: 2432/C=Lehti 4/88: DigiClock -pulma--> # Current level topic id/name
 * <!--Level 1: 2524/Ohjelmointi--> # Level 1 topic id/name
 * <!--Level 2: 3924/Viestit 2003--> # Level 2 topic id/name
 * <!--Level 3: 2432/C=Lehti 4/88: DigiClock -pulma--> # Level 3 topic id/name
 * <!--Properties: icons=1;hidden=0--> # Properties
 * <!--Param: MessagesAdd--> # Action to perform for example Sublist, MessagesAdd
 * <!--Parent: 3924--> # Parent topic id
 * <!--Announcement-->
 * <b>Torin toimintaohje:</b> J??t?? ilmoitus jollekin allaolevista osastoista. Muista laittaa yhteystietosi mukaan ilmoitukseesi, sill?? varsinainen kaupank??ynti tulisi hoitaa yksityisesti. V??lt?? ilmoitusten turhaa kommentointia, muut osastot ovat softa/laitekeskustelua varten. <BR> <BR>Jos jokin ilmoitus her??tt???? kysymyksi?? myyt??v????n/ostettavaan tuotteeseen liittyen, ota ensisijaisesti yhteytt?? suoraan myyj????n. Voit tehd?? siit?? my??s uuden ketjun sopivalle osastolle, mik??li koet ett?? keskustelusta on hy??ty?? muillekin lukijoille. Muistathan, ett?? Tori-osaston ketjut poistetaan 12 kk:n kuluttua. <BR> <BR>Suomen lain tai hyvien tapojen vastaiset ilmoitukset poistetaan, joten eth??n kauppaa piraattituotteita.  <BR> <BR><font color="ff0000"><b>Huuto.netiss?? myynniss?? oleville kohteille on oma osionsa</b></font>, joten j??t??th??n ilmoituksesi sinne, mik??li myym??si tuotteet ovat myynniss?? huuto.netiss??. <BR> <BR><font color="ff0000">HUOM! Kun tavara on myyty, ostettu yms., laita ilmoituksesi viestiketjuun uusi viesti, jossa mainitset asiasta, niin moderaattorit poistavat ilmoituksesi. Yli 12 kk vanhat viestiketjut poistetaan.</font>
 * <!--/Announcement-->
 * 
 */

const parseTopicFromText = (text: string): Topic => {
  const topicRegex = /<!--Topic: (\d+)\/(.+?)-->/;
  const meRegex = /<!--Me: (\d+)\/(.+?)-->/;
  const level1Regex = /<!--Level 1: (\d+)\/(.+?)-->/;
  const level2Regex = /<!--Level 2: (\d+)\/(.+?)-->/;
  const level3Regex = /<!--Level 3: (\d+)\/(.+?)-->/;
  const level4Regex = /<!--Level 4: (\d+)\/(.+?)-->/;
  const level5Regex = /<!--Level 5: (\d+)\/(.+?)-->/;
  const propertiesRegex = /<!--Properties: (.+?)-->/;
  const paramRegex = /<!--Param: (.+?)-->/;
  const parentRegex = /<!--Parent: (\d+)-->/;
  const announcementRegex = /<!--Announcement-->([\s\S]*?)<!--\/Announcement-->/;

  const topic = topicRegex.exec(text);
  const me = meRegex.exec(text);
  const level1 = level1Regex.exec(text);
  const level2 = level2Regex.exec(text);
  const level3 = level3Regex.exec(text);
  const level4 = level4Regex.exec(text);
  const level5 = level5Regex.exec(text);
  const properties = propertiesRegex.exec(text);
  const param = paramRegex.exec(text);
  const parent = parentRegex.exec(text);
  const announcement = announcementRegex.exec(text);

  const mainTopic = topic && topic[2] || "";
  const mainTopicId = topic && Number(topic[1]) || 0;

  // Set up the levels (main topic is always level 0)
  const levels: Level[] = [{
    id: mainTopicId,
    name: mainTopic,
  }];

  if (level1) {
    levels.push({
      id: Number(level1[1]),
      name: level1[2],
    });
  }

  if (level2) {
    levels.push({
      id: Number(level2[1]),
      name: level2[2],
    });
  }

  if (level3) {
    levels.push({
      id: Number(level3[1]),
      name: level3[2],
    });
  }

  if (level4) {
    levels.push({
      id: Number(level4[1]),
      name: level4[2],
    });
  }

  if (level5) {
    levels.push({
      id: Number(level5[1]),
      name: level5[2],
    });
  }

  return {
    mainTopicId,
    mainTopic,
    me: me && me[2] || "",
    meId: me && Number(me[1]) || 0,
    properties: properties && properties[1] || undefined,
    param: param && param[1] || undefined,
    parent: parent && Number(parent[1]) || 0,
    levels,
    announcement_html: announcement && announcement[1] || undefined,
    announcement_md: announcement && announcement[1] && td.turndown(announcement[1]) || undefined,
  };
};

const parseEmailFromATag = (aTag: string): string | undefined => {
  const emailRegex = /mailto:(.+?)"/;
  const email = emailRegex.exec(aTag);
  return email && email[1] || undefined;
};

/**
 * There are also posts in the page and they are in the following format:
 * <!--Post: 8316--><!--Time: 1043846797-->
 * <!--p:--><tr bgcolor="#f5f5ff"><td valign=top><a name="POST8316"><a href="#MT"><img src="http://saku.bbs.fi/discus/icons/mark_top.gif" height=12 width=12 border=0 alt=""></a><a href="#POST8228"><img src="http://saku.bbs.fi/discus/icons/mark_up.gif" border=0 alt=""></a><a href="#POST11363"><img src="http://saku.bbs.fi/discus/icons/mark_down.gif" border=0 alt=""></a><a href="#MB"><img src="http://saku.bbs.fi/discus/icons/mark_bottom.gif" border=0 alt=""></a>&nbsp;<a href="http://saku.bbs.fi/cgi-bin/discus/show.cgi?tpc=3&post=8316#POST8316" onClick="alert('Liitt???ksesi linkin viestiin, klikkaa "hiiri oikealla" ja valitse kopioi pikakuvake. Valitse liit??? liitt??????ksesi linkin viestiin.'); return false;"><img src="http://saku.bbs.fi/discus/icons/tree_m.gif" border=0 alt=""></a><br><br><font face="Verdana,Arial,Helvetica" size="2"><b><!--email--><a href="mailto:pauli.vahasarja@mbnet.fi" target="_blank"><!--/email--><!--name-->Pauli<!--/name--></b></a>
 * </a><br><!--field:posts--><!--/field--><!--field:registered--><!--/field--><!--field:ip_address--><!--/field--></font></font></td><td valign=top><font face="Verdana,Arial,Helvetica" size="2"><table width=100% border=0 cellspacing=0 cellpadding=0><tr><td align=left><font face="Verdana,Arial,Helvetica" size="2"><strong> Keskiviikkona,  29. tammikuuta, 2003 - klo 15.26:</strong> &nbsp;&nbsp;</font></td><td align=right></td></tr></table><!--Text-->JPQ: L&auml;hetin ascii koodin mailiisi.  <BR>Laitoin  korjatun version koodista, uuden kuvan ja ascii version koodista t&auml;nne: <A HREF="http://koti.mbnet.fi/tritium" TARGET="_top">http://koti.mbnet.fi/tritium</A><!--/Text--><br><br>
 * </td></tr>
 * <!--/Post: 8316-->
 * 
 * From that we need to parse the following: <!--Text--> and <!--/Text--):
 * <!--Text-->JPQ: L&auml;hetin ascii koodin mailiisi.  <BR>Laitoin  korjatun version koodista, uuden kuvan ja ascii version koodista t&auml;nne: <A HREF="http://koti.mbnet.fi/tritium" TARGET="_top">http://koti.mbnet.fi/tritium</A><!--/Text-->
 *
 * Author (name) is in <!--name-->Pauli<!--/name-->
 * Author email is in <!--email-->foo@bar.com<!--/email-->
 */
const parsePostsFromText = (text: string): Post[] => {
  const postRegex = /<!--Post: (\d+)--><!--Time: (\d+)-->([\s\S]*?)<!--\/Post: \d+-->/g;
  const invidualPostRegex = /<!--Text-->([\s\S]*?)<!--\/Text-->/;
  const authorNameRegex = /<!--name-->([\s\S]*?)<!--\/name-->/;
  const authorEmailRegex = /<!--email-->([\s\S]*?)<!--\/email-->/;

  // Parse posts
  const posts: Post[] = [];
  let post;
  while ((post = postRegex.exec(text)) !== null) {
    const postId = Number(post[1]);
    const postTime = Number(post[2]);
    const postText = invidualPostRegex.exec(post[3]);
    const postTextHtml = postText && postText[1] || "";
    const authorName = authorNameRegex.exec(post[3]);
    const authorEmail = authorEmailRegex.exec(post[3]);
  
    posts.push({
      id: postId,
      time: postTime,
      authorName: authorName && authorName[1] || "",
      authorEmail: authorEmail && authorEmail[1] && parseEmailFromATag(authorEmail[1]) || "",
      html: postTextHtml,
      md: td.turndown(postTextHtml)
    });
  }

  return posts;
};

/**
 * Example filename: ../../discus/messages/3/2432.html
 */
export const convertFile = async (filename: string) => {

  const text = await Deno.readTextFile(filename);
  const posts = parsePostsFromText(text);
  const topic = parseTopicFromText(text);
  const subTopics = parseSubTopicsFromText(text);

  return {
    topic,
    posts,
    subTopics,
  }
};








