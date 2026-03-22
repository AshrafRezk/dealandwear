export const filterRelevantProducts = (products, gender) => {
  if (!gender || gender === 'Prefer_Not_to_Say') return products;
  const isMen = gender === 'Men';
  const isWomen = gender === 'Women';

  return products.filter(p => {
    // 1. Check genderAudience field
    if (p.genderAudience && p.genderAudience !== 'Unisex') {
      if (isMen && (p.genderAudience === 'Women' || p.genderAudience === 'Kids')) return false;
      if (isWomen && (p.genderAudience === 'Men' || p.genderAudience === 'Kids')) return false;
    }

    // 2. Keyword-based exclusion (Name and Tags)
    const name = (p.name || p.Name || '').toLowerCase();
    const tags = (p.tagsCombined || p.Tags__c || p.brandTags || '').toLowerCase();
    const combined = `${name} ${tags}`;

    if (isMen) {
      const femaleKws = ['women', 'girl', 'lady', 'ladies', 'bra', 'panty', 'panties', 'skirt', 'dress', 'بناتي', 'نسائي', 'حريمي', 'السيدات', 'برا ', 'فستان', 'جيبة', 'تنورة'];
      const kidsKws = ['kids', 'child', 'baby', 'infant', 'toddler', 'أطفال', 'اطفال', 'بيبي', 'اولادي', 'ولادي', 'كيدز'];
      if (femaleKws.some(kw => combined.includes(kw))) return false;
      if (kidsKws.some(kw => combined.includes(kw))) return false;
    } else if (isWomen) {
      const maleKws = ['men', 'boy', 'menswear', 'رجالي', 'الرجال', 'شورت رجالي', 'قميص رجالي'];
      const kidsKws = ['kids', 'child', 'baby', 'infant', 'toddler', 'أطفال', 'اطفال', 'بيبي', 'اولادي', 'ولادي', 'كيدز'];
      if (maleKws.some(kw => combined.includes(kw))) return false;
      if (kidsKws.some(kw => combined.includes(kw))) return false;
    }

    return true;
  });
};

export const isBrandRelevant = (brand, gender) => {
  if (!gender || gender === 'Prefer_Not_to_Say') return true;
  const isMen = gender === 'Men';
  const isWomen = gender === 'Women';
  
  const hasMatchingTag = brand.tags?.some(t => 
    t === gender || t === 'Unisex' || t.toLowerCase() === gender.toLowerCase()
  );

  const hasOppositeTag = brand.tags?.some(t => {
    const lt = t.toLowerCase();
    if (isMen && (lt === 'women' || lt === 'kids' || lt === 'girls' || lt === 'بناتي' || lt === 'اطفال')) return true;
    if (isWomen && (lt === 'men' || lt === 'kids' || lt === 'boys' || lt === 'رجالي' || lt === 'اطفال')) return true;
    return false;
  });

  return hasMatchingTag && !hasOppositeTag;
};
