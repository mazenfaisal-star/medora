/* Medora Skeletal Atlas
 * Regional and individual bone viewers use the BoneHub Visible Human dataset.
 * Dataset licence: CC BY 4.0. See ATTRIBUTION.txt for full credits and limitations.
 */
(function () {
  'use strict';

  const MANIFEST_URL = 'https://bonehub.github.io/Educational-Atlas/data/manifest.json';
  const HF_DATASET = 'https://huggingface.co/datasets/BoneHub/visible-human-3d-models/resolve/';
  const SUBJECT_ID = '01_Male';
  const FULL_SKELETON_MODEL = 'https://sketchfab.com/models/d04e251ee8a242fcb57db58f3989def4/embed';

  const categories = [
    {id:'skull', name:'عظام الجمجمة والوجه', en:'Skull and facial bones', aliases:['الجمجمة','عظام الجمجمة','عظام الوجه','skull','facial bones','skull bones'], regionIds:['SKULL'], description:'تحيط الجمجمة بالدماغ وتكوّن هيكل الوجه، وتوفر نقاط ارتكاز لعضلات الوجه والمضغ وتحمي تراكيب حسية مهمة.', note:'حدود المصدر: ملف الجمجمة يجمع عظام القحف مع الفك العلوي في نموذج واحد، بينما الفك السفلي نموذج منفصل. لم تُقسّم العظام الوجهية الصغيرة كل واحدة على حدة في مجموعة البيانات الحالية.'},
    {id:'spine', name:'العمود الفقري والفقرات', en:'Vertebral column and vertebrae', aliases:['العمود الفقري','العمود الفقرى','الفقرات','فقرات','spine','spinal column','vertebral column','vertebrae'], regionIds:['SPINAL_COLUMN'], description:'يمتد العمود الفقري من قاعدة الجمجمة إلى الحوض. يدعم الرأس والجذع، ويسمح بالحركة، ويحيط بالقناة الفقرية التي يمر داخلها الحبل الشوكي.', note:'تُعرض الفقرات المتاحة كعظام منفصلة داخل النموذج الإقليمي، بينما يظهر العجز مع العصعص كتركيب واحد في هذا المصدر.'},
    {id:'thorax', name:'القفص الصدري والأضلاع', en:'Thoracic cage and ribs', aliases:['القفص الصدري','الأضلاع','الاضلاع','الضلوع','عظام الصدر','thorax','rib cage','ribs','sternum'], regionIds:['THORAX'], description:'يتكوّن القفص الصدري العظمي من الأضلاع وعظم القص والفقرات الصدرية. يساهم في حماية القلب والرئتين ويدعم حركة التنفس.', note:'يحتوي النموذج على الأضلاع وعظم القص. الغضاريف الضلعية غير موجودة في ملفات العظام، لذلك قد لا يظهر اتصال عظمي مباشر بين نهايات الأضلاع والقص.'},
    {id:'upper-limb', name:'الحزام الكتفي وعظام الذراع واليد', en:'Shoulder girdle, arm and hand bones', aliases:['الحزام الكتفي','عظام الذراع','عظام اليد','الطرف العلوي','الاطراف العلوية','upper limb','upper extremity','shoulder girdle','arm bones','hand bones'], regionIds:['UPPER_EXTREMITY_LEFT','UPPER_EXTREMITY_RIGHT','HAND_LEFT','HAND_RIGHT'], description:'يربط الحزام الكتفي الطرف العلوي بالجذع، وتعمل عظام الذراع والساعد واليد معًا لتوفير مدى واسع من الحركة والإمساك والمهارات الدقيقة.', note:'تُعرض عظام اليد ضمن المجموعة نفسها لتسهيل التصفح. في بعض ملفات المصدر تُجمع سلاميات كل إصبع في نموذج واحد بدل فصل السلامية القريبة والوسطى والبعيدة كل واحدة على حدة.'},
    {id:'pelvis', name:'الحوض', en:'Pelvis', aliases:['الحوض','عظام الحوض','عظم الورك','عظام الورك','pelvis','pelvic bones','hip bones'], regionIds:['LOWER_EXTREMITY_LEFT','LOWER_EXTREMITY_RIGHT','SPINAL_COLUMN'], description:'يتكوّن الهيكل العظمي للحوض من عظمي الورك مع العجز والعصعص. يربط الجذع بالطرفين السفليين، وينقل وزن الجسم، ويساهم في حماية أحشاء الحوض.', note:'تُجمع هنا عظمتا الورك مع العجز لتقديم صورة تعليمية أقرب للحوض الكامل. العجز والعصعص يظهران كتركيب واحد في مصدر العظام المستخدم.'},
    {id:'lower-limb', name:'عظام الساق والقدم', en:'Leg and foot bones', aliases:['عظام الساق','عظام القدم','الطرف السفلي','الاطراف السفلية','lower limb','lower extremity','leg bones','foot bones'], regionIds:['LOWER_EXTREMITY_LEFT','LOWER_EXTREMITY_RIGHT','FOOT_LEFT','FOOT_RIGHT'], description:'تشمل عظام الفخذ والساق والرضفة وعظام القدم. تحمل وزن الجسم وتساهم في الوقوف والمشي والجري والاتزان.', note:'يضم المصدر عظام القدم مفردة إلى حد كبير، بينما تُجمع سلاميات أصابع القدم في ملف واحد لكل إصبع. بعض العظام السمسمانية الصغيرة غير ممثلة في هذه المجموعة.'}
  ];

  const normalize = function (value) {
    return String(value || '').toLocaleLowerCase().normalize('NFKD')
      .replace(/[\u064B-\u065F\u0670]/g, '')
      .replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
      .replace(/[ـ]/g, '').replace(/[_–—-]/g, ' ').replace(/\s+/g, ' ').trim();
  };

  const boneEnglish = function (id) {
    const side = /_LEFT$/.test(id) ? ' (left)' : /_RIGHT$/.test(id) ? ' (right)' : '';
    const base = id.replace(/_(LEFT|RIGHT)$/, '');
    const known = {
      SKULL_CRANIAL_MAXILLA:'Cranium and maxilla (combined)', SKULL_MANDIBLE:'Mandible',
      SACRUM:'Sacrum and coccyx (combined)', STERNUM:'Sternum',
      CLAVICLE:'Clavicle', HUMERUS:'Humerus', RADIUS:'Radius', SCAPULA:'Scapula', ULNA:'Ulna',
      HIP:'Hip bone', FEMUR:'Femur', FIBULA:'Fibula', PATELLA:'Patella', TIBIA:'Tibia',
      CAPITATE:'Capitate', HAMATE:'Hamate', LUNATE:'Lunate', PISIFORM:'Pisiform',
      SCAPHOID:'Scaphoid', TRAPEZIUM:'Trapezium', TRAPEZOID:'Trapezoid', TRIQUETRUM:'Triquetrum',
      CALCANEUS:'Calcaneus', CUBOID:'Cuboid', INTERMEDIATE_CUNEIFORM:'Intermediate cuneiform',
      LATERAL_CUNEIFORM:'Lateral cuneiform', MEDIAL_CUNEIFORM:'Medial cuneiform', NAVICULAR:'Navicular',
      TALUS:'Talus'
    };
    let label = known[base];
    if (!label) {
      let m = base.match(/^VERTEBRA_([CTL])(\d+)$/);
      if (m) label = ({C:'Cervical vertebra ',T:'Thoracic vertebra ',L:'Lumbar vertebra '})[m[1]] + m[2];
      m = base.match(/^RIB_(\d+)$/);
      if (m) label = 'Rib ' + m[1];
      m = base.match(/^METACARPAL_(\d+)$/);
      if (m) label = 'Metacarpal ' + m[1];
      m = base.match(/^METATARSAL_(\d+)$/);
      if (m) label = 'Metatarsal ' + m[1];
      m = base.match(/^PHALANGE_(HAND|FOOT)_(\d+)$/);
      if (m) label = 'Phalanges of ' + (m[1] === 'HAND' ? 'finger ' : 'toe ') + m[2] + ' (grouped)';
    }
    if (!label) label = base.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
    return label + side;
  };

  const boneArabic = function (id) {
    const side = /_LEFT$/.test(id) ? ' الأيسر' : /_RIGHT$/.test(id) ? ' الأيمن' : '';
    const base = id.replace(/_(LEFT|RIGHT)$/, '');
    const known = {
      SKULL_CRANIAL_MAXILLA:'عظام القحف والفك العلوي (مجموعة)', SKULL_MANDIBLE:'الفك السفلي',
      SACRUM:'العجز والعصعص (مجموعة)', STERNUM:'عظم القص',
      CLAVICLE:'عظم الترقوة', HUMERUS:'عظم العضد', RADIUS:'عظم الكعبرة', SCAPULA:'لوح الكتف', ULNA:'عظم الزند',
      HIP:'عظم الورك', FEMUR:'عظم الفخذ', FIBULA:'عظم الشظية', PATELLA:'عظمة الرضفة', TIBIA:'عظم الظنبوب',
      CAPITATE:'العظم الكبير (الرأسّي)', HAMATE:'العظم الخطافي', LUNATE:'العظم الهلالي', PISIFORM:'العظم الحمصي',
      SCAPHOID:'العظم الزورقي', TRAPEZIUM:'العظم شبه المنحرف', TRAPEZOID:'العظم شبه المنحرف الصغير', TRIQUETRUM:'العظم المثلثي',
      CALCANEUS:'عظم العَقِب', CUBOID:'العظم المكعّب', INTERMEDIATE_CUNEIFORM:'العظم الإسفيني الأوسط',
      LATERAL_CUNEIFORM:'العظم الإسفيني الوحشي', MEDIAL_CUNEIFORM:'العظم الإسفيني الإنسي', NAVICULAR:'العظم الزورقي للقدم',
      TALUS:'عظم الكاحل'
    };
    if (known[base]) return known[base] + side;
    let m = base.match(/^VERTEBRA_([CTL])(\d+)$/);
    if (m) return ({C:'الفقرة العنقية ',T:'الفقرة الصدرية ',L:'الفقرة القطنية '})[m[1]] + m[2];
    m = base.match(/^RIB_(\d+)$/);
    if (m) return 'الضلع ' + m[1] + side;
    m = base.match(/^METACARPAL_(\d+)$/);
    if (m) return 'عظم مشط اليد رقم ' + m[1] + side;
    m = base.match(/^METATARSAL_(\d+)$/);
    if (m) return 'عظم مشط القدم رقم ' + m[1] + side;
    m = base.match(/^PHALANGE_(HAND|FOOT)_(\d+)$/);
    if (m) return (m[1] === 'HAND' ? 'سلاميات الإصبع ' : 'سلاميات إصبع القدم ') + m[2] + side + ' (مجموعة)';
    return base.toLowerCase().replace(/_/g, ' ') + side;
  };

  const boneInfo = function (id) {
    if (/^VERTEBRA_C/.test(id)) return {summary:'فقرة من المنطقة العنقية في أعلى العمود الفقري. تشارك الفقرات العنقية في دعم الرأس والسماح بحركته، مع حماية الجزء العلوي من الحبل الشوكي.', function:'تتصل الفقرة بالفقرات المجاورة عبر المفاصل والأقراص بين الفقرات في المستويات المتحركة.'};
    if (/^VERTEBRA_T/.test(id)) return {summary:'فقرة من المنطقة الصدرية، وترتبط بها الأضلاع لتكوين الجزء الخلفي من القفص الصدري.', function:'تساعد على دعم الجذع وتوفير نقاط اتصال للأضلاع، مع حماية الحبل الشوكي.'};
    if (/^VERTEBRA_L/.test(id)) return {summary:'فقرة من المنطقة القطنية في أسفل الظهر، وهي منطقة تتحمل جزءًا كبيرًا من أحمال الجذع.', function:'تدعم وزن الجزء العلوي من الجسم وتساهم في حركات الثني والتمدد.'};
    if (id === 'SACRUM') return {summary:'العجز عظم مثلثي يقع في قاعدة العمود الفقري ويتصل بعظمي الورك. ملف المصدر يضم العصعص معه في نموذج واحد.', function:'ينقل الأحمال من العمود الفقري إلى الحوض والطرفين السفليين.'};
    if (/^RIB_/.test(id)) return {summary:'أحد أضلاع القفص الصدري. تتصل الأضلاع خلفيًا بالفقرات الصدرية، وتساهم في إحاطة الصدر وحماية الأعضاء داخله.', function:'تتحرك مع جدار الصدر أثناء التنفس وتساعد على حماية القلب والرئتين.'};
    if (id === 'STERNUM') return {summary:'عظم القص يقع في منتصف الجزء الأمامي من القفص الصدري، وتتصل به غضاريف عدد من الأضلاع.', function:'يساهم في حماية محتويات الصدر وتكوين الدعامة الأمامية للقفص الصدري.'};
    if (id.indexOf('SKULL_') === 0) return {summary:'جزء من الهيكل العظمي للرأس. يساهم في حماية الدماغ أو تكوين إطار الوجه بحسب التركيب الممثل في النموذج.', function:'يوفر الدعامة والحماية ونقاط الارتكاز لبعض عضلات الرأس والوجه.'};
    if (/CLAVICLE|SCAPULA/.test(id)) return {summary:'عظم من الحزام الكتفي يربط الطرف العلوي بالهيكل المحوري ويوفر قاعدة لحركة الكتف.', function:'يساعد على توجيه حركة الطرف العلوي ونقل القوى بين الذراع والجذع.'};
    if (/HUMERUS/.test(id)) return {summary:'عظم العضد هو العظم الطويل في الجزء العلوي من الذراع بين الكتف والمرفق.', function:'يشارك في مفصلي الكتف والمرفق ويوفر مواضع ارتباط للعضلات.'};
    if (/RADIUS|ULNA/.test(id)) return {summary:'أحد عظمي الساعد. يعمل مع العظم الآخر على تكوين مفصلي المرفق والرسغ ويسمح بحركات الساعد.', function:'يساهم في نقل القوى بين اليد والذراع وفي حركات الكب والاستلقاء بحسب العظم.'};
    if (/CAPITATE|HAMATE|LUNATE|PISIFORM|SCAPHOID|TRAPEZIUM|TRAPEZOID|TRIQUETRUM/.test(id)) return {summary:'عظم من عظام الرسغ، يقع بين نهاية الساعد وعظام مشط اليد.', function:'يساهم مع بقية عظام الرسغ في تكوين مفاصل مرنة تسمح بحركة اليد وتوزيع الأحمال.'};
    if (/METACARPAL/.test(id)) return {summary:'أحد عظام مشط اليد، يقع بين عظام الرسغ وسلاميات الأصابع.', function:'يساهم في تكوين راحة اليد ونقل القوى إلى الأصابع.'};
    if (/PHALANGE_HAND/.test(id)) return {summary:'ملف تجميعي لسلاميات أحد أصابع اليد في مجموعة البيانات؛ لا يفصل كل سلامية منفردة.', function:'تشارك سلاميات الأصابع في الثني والبسط والإمساك الدقيق.'};
    if (id.indexOf('HIP_') === 0) return {summary:'عظم الورك أحد نصفي الحوض، ويتصل بالعجز ويشارك في تكوين تجويف مفصل الورك.', function:'ينقل وزن الجذع إلى الطرف السفلي ويساهم في حماية أحشاء الحوض.'};
    if (/FEMUR/.test(id)) return {summary:'عظم الفخذ هو العظم الطويل في الفخذ، ويصل مفصل الورك بمفصل الركبة.', function:'يحمل أحمالًا كبيرة أثناء الوقوف والحركة ويشارك في مفصلي الورك والركبة.'};
    if (/PATELLA/.test(id)) return {summary:'الرضفة عظم يقع أمام مفصل الركبة داخل وتر العضلة رباعية الرؤوس.', function:'تحمي الجزء الأمامي من مفصل الركبة وتحسن ذراع عزم العضلة رباعية الرؤوس.'};
    if (/TIBIA/.test(id)) return {summary:'عظم الظنبوب هو العظم الإنسي الأكبر في الساق بين الركبة والكاحل.', function:'يتحمل معظم وزن الجسم المنقول عبر الساق.'};
    if (/FIBULA/.test(id)) return {summary:'عظم الشظية هو العظم الوحشي الرفيع في الساق، ويشارك في استقرار مفصل الكاحل.', function:'يوفر مواضع لارتباط العضلات ويساهم في دعم الجانب الوحشي للكاحل.'};
    if (/CALCANEUS|CUBOID|CUNEIFORM|NAVICULAR|TALUS/.test(id)) return {summary:'عظم من عظام الرُّصغ في القدم، يساهم في بناء القوس أو مفاصل القدم والكاحل.', function:'يساعد على توزيع الأحمال وامتصاصها أثناء الوقوف والمشي.'};
    if (/METATARSAL/.test(id)) return {summary:'أحد عظام مشط القدم، يقع بين عظام الرصغ وسلاميات أصابع القدم.', function:'يساهم في تكوين مقدمة القدم ونقل الوزن أثناء المشي.'};
    if (/PHALANGE_FOOT/.test(id)) return {summary:'ملف تجميعي لسلاميات أحد أصابع القدم في مجموعة البيانات؛ لا يفصل كل سلامية منفردة.', function:'تشارك سلاميات أصابع القدم في الاتزان والدفع أثناء المشي.'};
    return {summary:'عظم من الهيكل العظمي البشري، يعرض هنا كنموذج ثلاثي الأبعاد مستقل للتعرف على شكله وموضعه.', function:'تختلف وظيفته بحسب موقعه واتصاله بالعظام والمفاصل المجاورة.'};
  };

  let manifestPromise = null;
  let manifest = null;
  let boneRecords = [];
  const loadManifest = function () {
    if (!manifestPromise) {
      manifestPromise = fetch(MANIFEST_URL, {mode:'cors'}).then(function (response) {
        if (!response.ok) throw new Error('تعذر تحميل فهرس العظام (' + response.status + ')');
        return response.json();
      }).then(function (data) {
        manifest = data;
        boneRecords = buildBoneRecords(data);
        return data;
      });
    }
    return manifestPromise;
  };

  const recordsForCategory = function (category, data) {
    const out = [];
    data.regions.forEach(function (region) {
      region.bones.forEach(function (bone) {
        if (!bone.files || !bone.files[SUBJECT_ID] || bone.files[SUBJECT_ID].stl === undefined) return;
        const id = bone.id;
        let include = false;
        if (category.id === 'skull') include = region.id === 'SKULL';
        if (category.id === 'spine') include = region.id === 'SPINAL_COLUMN';
        if (category.id === 'thorax') include = region.id === 'THORAX';
        if (category.id === 'upper-limb') include = ['UPPER_EXTREMITY_LEFT','UPPER_EXTREMITY_RIGHT','HAND_LEFT','HAND_RIGHT'].indexOf(region.id) >= 0;
        if (category.id === 'pelvis') include = id === 'SACRUM' || /^HIP_/.test(id);
        if (category.id === 'lower-limb') include = ['FOOT_LEFT','FOOT_RIGHT'].indexOf(region.id) >= 0 || ((region.id === 'LOWER_EXTREMITY_LEFT' || region.id === 'LOWER_EXTREMITY_RIGHT') && !/^HIP_/.test(id));
        if (include) out.push({id:id, regionId:region.id, name:boneArabic(id), en:boneEnglish(id), categoryId:category.id});
      });
    });
    return out;
  };

  const buildBoneRecords = function (data) {
    let all = [];
    categories.forEach(function (category) {
      recordsForCategory(category, data).forEach(function (record) {
        if (!all.some(function (existing) { return existing.id === record.id; })) all.push(record);
      });
    });
    return all;
  };

  const categoryForQuery = function (query) {
    const q = normalize(query);
    if (!q) return null;
    return categories.find(function (category) {
      return [category.name, category.en].concat(category.aliases).some(function (term) {
        const n = normalize(term);
        return n === q || (q.length >= 5 && (n.includes(q) || q.includes(n)));
      });
    }) || null;
  };

  const isSystemQuery = function (query) {
    const q = normalize(query);
    return ['الجهاز الهيكلي','الهيكل العظمي','الجهاز العظمي','skeletal system','human skeleton','skeleton','skeleton anatomy'].some(function (term) {
      return normalize(term) === q;
    });
  };

  const boneForQuery = function (query) {
    const raw = String(query || '').trim();
    const direct = raw.match(/^bone:([A-Z0-9_]+)$/i);
    if (direct) return boneRecords.find(function (bone) { return bone.id.toUpperCase() === direct[1].toUpperCase(); }) || null;
    const q = normalize(raw);
    if (!q) return null;
    let found = boneRecords.find(function (bone) {
      return normalize(bone.name) === q || normalize(bone.en) === q || normalize(bone.id) === q;
    });
    if (found) return found;
    if (q.length < 5) return null;
    const hits = boneRecords.filter(function (bone) {
      return [bone.name, bone.en, bone.id].some(function (term) {
        const n = normalize(term);
        return n.length >= 5 && (n.includes(q) || q.includes(n));
      });
    });
    return hits.length === 1 ? hits[0] : null;
  };

  const search = function (query) {
    const q = normalize(query);
    if (!q) return [];
    const hits = [];
    if (isSystemQuery(query)) hits.push({type:'system', id:'skeletal-system', name:'الجهاز الهيكلي', en:'Skeletal system', description:'استكشف الهيكل العظمي الكامل ثم الأقسام الستة والعظام المكوّنة لكل قسم.'});
    categories.forEach(function (category) {
      const terms = [category.name, category.en].concat(category.aliases);
      if (terms.some(function (term) { const n = normalize(term); return n === q || (q.length >= 4 && (n.includes(q) || q.includes(n))); })) {
        hits.push({type:'category', id:category.id, name:category.name, en:category.en, description:category.description});
      }
    });
    boneRecords.filter(function (bone) {
      return [bone.name, bone.en, bone.id].some(function (term) {
        const n = normalize(term);
        return n === q || (q.length >= 4 && n.includes(q));
      });
    }).slice(0, 8).forEach(function (bone) {
      hits.push({type:'bone', id:bone.id, name:bone.name, en:bone.en, description:boneInfo(bone.id).summary});
    });
    return hits.slice(0, 10);
  };

  const topicUrl = function (query) {
    const url = new URL('topic.html', window.location.href);
    url.searchParams.set('q', query);
    return url.pathname + url.search;
  };

  const sectionCard = function (category) {
    const count = manifest ? recordsForCategory(category, manifest).length : 0;
    return '<a class="skeletal-category-card" href="' + topicUrl(category.name) + '">' +
      '<span class="skeletal-card-icon" aria-hidden="true">' + ({skull:'◉',spine:'▤',thorax:'◇','upper-limb':'↗',pelvis:'⌂','lower-limb':'⇣'}[category.id] || '✦') + '</span>' +
      '<span class="skeletal-card-copy"><b>' + category.name + '</b><small dir="ltr">' + category.en + '</small><em>' + count + ' نماذج عظمية</em></span><span class="skeletal-arrow">↗</span></a>';
  };

  const boneCard = function (bone) {
    const info = boneInfo(bone.id);
    return '<a class="skeletal-bone-card" href="' + topicUrl('bone:' + bone.id) + '">' +
      '<span><b>' + bone.name + '</b><small dir="ltr">' + bone.en + '</small><em>' + info.summary + '</em></span><span class="skeletal-arrow">↗</span></a>';
  };

  const sourceLinks = function () {
    return '<div class="skeletal-sources"><b>مصادر النماذج والتوثيق</b>' +
      '<a href="https://bonehub.github.io/Educational-Atlas/" target="_blank" rel="noopener noreferrer">BoneHub Educational Atlas ↗</a>' +
      '<a href="https://huggingface.co/datasets/BoneHub/visible-human-3d-models" target="_blank" rel="noopener noreferrer">مجموعة النماذج وبيانات المصدر ↗</a>' +
      '<a href="https://doi.org/10.57967/hf/10464" target="_blank" rel="noopener noreferrer">بيانات الاستشهاد بالمجموعة ↗</a></div>';
  };

  const pageTitle = function (title, subtitle) {
    const titleNode = document.getElementById('topicPageTitle');
    const crumb = document.getElementById('topicBreadcrumb');
    const subtitleNode = document.getElementById('topicPageSubtitle');
    if (titleNode) titleNode.textContent = title;
    if (crumb) crumb.textContent = title;
    if (subtitleNode) subtitleNode.textContent = subtitle;
    document.title = title + ' | Medora';
    const home = document.getElementById('home');
    const page = document.getElementById('topicPage');
    if (home) home.hidden = true;
    if (page) page.hidden = false;
  };

  const makeViewerMarkup = function (kind, id) {
    return '<div class="skeletal-viewer-wrap"><div class="skeletal-viewer" data-skeletal-viewer data-view-kind="' + kind + '" data-view-id="' + id + '">' +
      '<div class="skeletal-viewer-loading"><b>جارٍ تجهيز النموذج التشريحي…</b><span>يتم تحميل ملفات العظام عند فتح هذه الصفحة فقط.</span></div></div>' +
      '<div class="skeletal-viewer-tools"><button type="button" data-skeletal-reset>إعادة ضبط العرض</button><button type="button" data-skeletal-rotate>إيقاف الدوران</button><span data-skeletal-status role="status">يتطلب عرض المجسم اتصالًا بالإنترنت.</span></div></div>';
  };

  const groupBonesForSection = function (category, bones) {
    if (category.id === 'spine') return [
      {title:'الفقرات العنقية', test:function (b) { return /^VERTEBRA_C/.test(b.id); }},
      {title:'الفقرات الصدرية', test:function (b) { return /^VERTEBRA_T/.test(b.id); }},
      {title:'الفقرات القطنية', test:function (b) { return /^VERTEBRA_L/.test(b.id); }},
      {title:'العجز والعصعص', test:function (b) { return b.id === 'SACRUM'; }}
    ].map(function (group) { return {title:group.title,bones:bones.filter(group.test)}; }).filter(function (group) { return group.bones.length; });
    if (category.id === 'upper-limb') return [
      {title:'الحزام الكتفي والذراع والساعد', test:function (b) { return /^(CLAVICLE|SCAPULA|HUMERUS|RADIUS|ULNA)_/.test(b.id); }},
      {title:'عظام الرسغ', test:function (b) { return /^(CAPITATE|HAMATE|LUNATE|PISIFORM|SCAPHOID|TRAPEZIUM|TRAPEZOID|TRIQUETRUM)_/.test(b.id); }},
      {title:'عظام مشط اليد والسلاميات', test:function (b) { return /^(METACARPAL|PHALANGE_HAND)_/.test(b.id); }}
    ].map(function (group) { return {title:group.title,bones:bones.filter(group.test)}; }).filter(function (group) { return group.bones.length; });
    if (category.id === 'lower-limb') return [
      {title:'عظام الفخذ والساق والركبة', test:function (b) { return /^(FEMUR|FIBULA|PATELLA|TIBIA)_/.test(b.id); }},
      {title:'عظام الرصغ والكاحل', test:function (b) { return /^(CALCANEUS|CUBOID|INTERMEDIATE_CUNEIFORM|LATERAL_CUNEIFORM|MEDIAL_CUNEIFORM|NAVICULAR|TALUS)_/.test(b.id); }},
      {title:'عظام مشط القدم والسلاميات', test:function (b) { return /^(METATARSAL|PHALANGE_FOOT)_/.test(b.id); }}
    ].map(function (group) { return {title:group.title,bones:bones.filter(group.test)}; }).filter(function (group) { return group.bones.length; });
    if (category.id === 'thorax') return [
      {title:'الأضلاع', test:function (b) { return /^RIB_/.test(b.id); }},
      {title:'عظم القص', test:function (b) { return b.id === 'STERNUM'; }}
    ].map(function (group) { return {title:group.title,bones:bones.filter(group.test)}; }).filter(function (group) { return group.bones.length; });
    if (category.id === 'pelvis') return [
      {title:'عظمتا الورك', test:function (b) { return /^HIP_/.test(b.id); }},
      {title:'العجز والعصعص', test:function (b) { return b.id === 'SACRUM'; }}
    ].map(function (group) { return {title:group.title,bones:bones.filter(group.test)}; }).filter(function (group) { return group.bones.length; });
    return [{title:'العظام الممثلة في هذا القسم',bones:bones}];
  };

  const renderSystemPage = function () {
    pageTitle('الجهاز الهيكلي','النموذج الكامل أولًا، ثم الأقسام الستة والعظام داخل كل قسم.');
    const content = document.getElementById('topicContent');
    if (!content) return;
    content.innerHTML =
      '<section class="skeletal-page-intro"><span class="topic-kicker">التشريح ثلاثي الأبعاد · الجهاز الهيكلي</span><h2>الهيكل العظمي البشري الكامل</h2><p>استكشف النموذج العام، ثم افتح أي قسم لمشاهدة نموذج ذلك القسم والعظام التي يتكوّن منها. كل عظمة متاحة في الفهرس تفتح صفحة مستقلة بنموذج ثلاثي الأبعاد وشرح تعليمي.</p>' +
      '<div class="skeletal-full-model"><iframe title="Human Skeleton — full interactive 3D model" loading="lazy" frameborder="0" allowfullscreen allow="autoplay; fullscreen; xr-spatial-tracking" src="' + FULL_SKELETON_MODEL + '"></iframe></div>' +
      '<p class="skeletal-credit">نموذج Human Skeleton 3D Model بواسطة Dinendra Neyo على Sketchfab، بترخيص Creative Commons Attribution (CC BY). <a href="https://sketchfab.com/3d-models/human-skeleton-3d-model-d04e251ee8a242fcb57db58f3989def4" target="_blank" rel="noopener noreferrer">صفحة النموذج والترخيص ↗</a></p></section>' +
      '<section class="skeletal-sections-panel"><div class="topic-summary-head"><div><span class="topic-kicker">تقسيمات الهيكل العظمي</span><h2>استكشف الأقسام</h2><p>افتح القسم لعرض نموذجه الكامل، ثم اختر أي عظمة من القائمة.</p></div><span class="topic-tag">6 أقسام</span></div><div class="skeletal-category-grid">' + categories.map(sectionCard).join('') + '</div></section>' +
      '<article class="topic-note skeletal-limit-note"><b>ملاحظة علمية:</b> النماذج مصدرها تقسيمات CT تعليمية. توجد بعض التراكيب مجمّعة في ملف واحد أو غير ممثلة، وتظهر هذه الحدود بوضوح في صفحة كل قسم.</article>' +
      sourceLinks();
  };

  const renderCategoryPage = function (category) {
    const content = document.getElementById('topicContent');
    if (!content) return;
    const bones = recordsForCategory(category, manifest);
    pageTitle(category.name, category.en + ' — نموذج القسم كاملًا ثم قائمة العظام وصفحاتها المستقلة.');
    const groups = groupBonesForSection(category, bones);
    const groupsHtml = groups.map(function (group) {
      return '<section class="skeletal-bone-group"><div class="skeletal-group-heading"><h3>' + group.title + '</h3><span>' + group.bones.length + ' نموذج</span></div><div class="skeletal-bone-grid">' + group.bones.map(boneCard).join('') + '</div></section>';
    }).join('');
    content.innerHTML =
      '<section class="skeletal-page-intro"><span class="topic-kicker">قسم من الجهاز الهيكلي</span><h2>' + category.name + ' <small dir="ltr">' + category.en + '</small></h2><p>' + category.description + '</p>' +
      makeViewerMarkup('category', category.id) +
      '<div class="skeletal-model-note">' + category.note + '</div></section>' +
      '<section class="skeletal-bones-panel"><div class="topic-summary-head"><div><span class="topic-kicker">العظام المكوّنة للقسم</span><h2>استكشف كل عظمة</h2><p>اضغط على بطاقة أي عظمة لفتح نموذجها المستقل وشرحها التشريحي.</p></div><span class="topic-tag">' + bones.length + ' نماذج عظمية</span></div>' + groupsHtml + '</section>' +
      '<div class="skeletal-navigation"><a href="' + topicUrl('الجهاز الهيكلي') + '">العودة إلى الجهاز الهيكلي ↗</a>' + (category.id !== 'spine' ? '<a href="' + topicUrl('العمود الفقري') + '">فتح العمود الفقري ↗</a>' : '') + '</div>' +
      sourceLinks();
    mountViewer();
  };

  const renderBonePage = function (bone) {
    const category = categories.find(function (item) { return item.id === bone.categoryId; }) || categories[0];
    const info = boneInfo(bone.id);
    const content = document.getElementById('topicContent');
    if (!content) return;
    pageTitle(bone.name, bone.en + ' — نموذج ثلاثي الأبعاد مستقل وشرح تشريحي مختصر.');
    content.innerHTML =
      '<section class="skeletal-page-intro"><span class="topic-kicker">عظمة منفردة · ' + category.name + '</span><h2>' + bone.name + ' <small dir="ltr">' + bone.en + '</small></h2>' +
      makeViewerMarkup('bone', bone.id) +
      '<article class="topic-summary-card skeletal-bone-detail"><h3>التعريف والموقع</h3><p>' + info.summary + '</p><h3>الوظيفة</h3><p>' + info.function + '</p>' +
      (bone.id === 'SKULL_CRANIAL_MAXILLA' || bone.id === 'SACRUM' || /^PHALANGE_/.test(bone.id) ? '<div class="skeletal-model-note">ملحوظة حول تقسيم المصدر: ' + (bone.id === 'SKULL_CRANIAL_MAXILLA' ? 'هذا الملف يجمع عظام القحف والفك العلوي؛ لا يعرضها كعظام منفصلة.' : bone.id === 'SACRUM' ? 'هذا الملف يجمع العجز والعصعص في نموذج واحد.' : 'ملف هذا الإصبع يجمع سلامياته ولا يفصل كل سلامية منفردة.') + '</div>' : '') +
      '<div class="skeletal-navigation"><a href="' + topicUrl(category.name) + '">العودة إلى ' + category.name + ' ↗</a><a href="' + topicUrl('الجهاز الهيكلي') + '">كل أقسام الجهاز الهيكلي ↗</a></div></article></section>' +
      sourceLinks();
    mountViewer();
  };

  const loadThreeModules = async function () {
    const modules = await Promise.all([
      import('https://cdn.jsdelivr.net/npm/three@0.170.0/+esm'),
      import('https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/controls/OrbitControls.js/+esm'),
      import('https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/loaders/STLLoader.js/+esm')
    ]);
    return {THREE:modules[0], OrbitControls:modules[1].OrbitControls, STLLoader:modules[2].STLLoader};
  };

  const mountViewer = async function () {
    const host = document.querySelector('[data-skeletal-viewer]');
    if (!host || host.dataset.mounted === '1') return;
    host.dataset.mounted = '1';
    const status = host.parentElement.querySelector('[data-skeletal-status]');
    const resetButton = host.parentElement.querySelector('[data-skeletal-reset]');
    const rotateButton = host.parentElement.querySelector('[data-skeletal-rotate]');
    const setStatus = function (message) { if (status) status.textContent = message; };
    try {
      await loadManifest();
      const kind = host.dataset.viewKind;
      const id = host.dataset.viewId;
      let items = [];
      if (kind === 'bone') {
        const bone = boneRecords.find(function (entry) { return entry.id === id; });
        if (bone) {
          const region = manifest.regions.find(function (entry) { return entry.id === bone.regionId; });
          items = [{id:bone.id,regionId:bone.regionId,file:bone.id}];
        }
      } else {
        const category = categories.find(function (entry) { return entry.id === id; });
        if (category) items = recordsForCategory(category, manifest).map(function (bone) { return {id:bone.id,regionId:bone.regionId,file:bone.id}; });
      }
      if (!items.length) throw new Error('لم يتم العثور على ملفات العظام لهذا القسم.');
      setStatus('جارٍ تحميل 0 من ' + items.length + ' نموذجًا عظميًا…');
      const libs = await loadThreeModules();
      const THREE = libs.THREE;
      const renderer = new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      host.innerHTML = '';
      const canvas = renderer.domElement;
      canvas.setAttribute('aria-label','نموذج تشريحي تفاعلي للعظام');
      host.appendChild(canvas);
      const scene = new THREE.Scene();
      scene.add(new THREE.HemisphereLight(0xffffff,0x8795a5,2.0));
      const keyLight = new THREE.DirectionalLight(0xffffff,2.2);
      keyLight.position.set(3,5,7); scene.add(keyLight);
      const fillLight = new THREE.DirectionalLight(0xd7e8ff,1.0);
      fillLight.position.set(-4,-2,3); scene.add(fillLight);
      const root = new THREE.Group(); scene.add(root);
      const camera = new THREE.PerspectiveCamera(38,1,0.1,100000);
      camera.up.set(0,0,1);
      const controls = new libs.OrbitControls(camera,canvas);
      controls.enableDamping = true; controls.dampingFactor = 0.07; controls.enablePan = true;
      controls.autoRotate = true; controls.autoRotateSpeed = 0.65;
      const palette = [0xe8d6b2,0xe9dfc8,0xd9c8a5,0xf0e2c4,0xd8d5ca,0xe1d4bd];
      const loader = new libs.STLLoader();
      let loaded = 0, failed = 0, next = 0;
      const loadOne = async function (item) {
        const url = HF_DATASET + encodeURIComponent(manifest.revision || 'main') + '/' +
          manifest.root + '/Mesh/' + SUBJECT_ID + '/' + item.regionId + '/' + item.file + '.stl';
        try {
          const geometry = await loader.loadAsync(url);
          geometry.computeVertexNormals();
          const material = new THREE.MeshStandardMaterial({color:palette[loaded % palette.length],roughness:0.76,metalness:0.02});
          const mesh = new THREE.Mesh(geometry,material);
          mesh.userData.boneId = item.id;
          root.add(mesh);
        } catch (error) {
          failed++;
          console.warn('Medora bone model failed to load:', item.id, error);
        }
        loaded++;
        setStatus('تم تحميل ' + (loaded - failed) + ' من ' + items.length + ' نموذجًا عظميًا' + (failed ? ' · تعذّر تحميل ' + failed : '') + '…');
      };
      const worker = async function () {
        while (next < items.length) {
          const item = items[next++];
          await loadOne(item);
        }
      };
      await Promise.all(Array.from({length:Math.min(4,items.length)},worker));
      if (!root.children.length) throw new Error('لم تنجح عملية تحميل ملفات المجسم. تحقق من اتصال الإنترنت ثم أعد تحميل الصفحة.');
      const bounds = new THREE.Box3().setFromObject(root);
      const center = bounds.getCenter(new THREE.Vector3());
      const size = bounds.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x,size.y,size.z,1);
      const fitCamera = function () {
        camera.position.set(center.x + maxDim * 0.72, center.y - maxDim * 2.15, center.z + maxDim * 0.42);
        camera.near = Math.max(0.01,maxDim / 3000);
        camera.far = maxDim * 30;
        camera.updateProjectionMatrix();
        controls.target.copy(center);
        controls.update();
      };
      fitCamera();
      const resize = function () {
        const width = Math.max(260,host.clientWidth || 640);
        const height = Math.max(300,host.clientHeight || 390);
        renderer.setSize(width,height,false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };
      const observer = new ResizeObserver(resize);
      observer.observe(host); resize();
      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      let pointerDown = null;
      canvas.addEventListener('pointerdown',function (event) { pointerDown = {x:event.clientX,y:event.clientY}; });
      canvas.addEventListener('pointerup',function (event) {
        if (!pointerDown || Math.hypot(event.clientX-pointerDown.x,event.clientY-pointerDown.y) > 6) return;
        const rect = canvas.getBoundingClientRect();
        pointer.x = ((event.clientX-rect.left)/rect.width)*2-1;
        pointer.y = -((event.clientY-rect.top)/rect.height)*2+1;
        raycaster.setFromCamera(pointer,camera);
        const hit = raycaster.intersectObjects(root.children,false)[0];
        if (hit && hit.object.userData.boneId && kind === 'category') {
          window.location.href = topicUrl('bone:' + hit.object.userData.boneId);
        }
      });
      if (resetButton) resetButton.addEventListener('click',fitCamera,{once:false});
      if (rotateButton) rotateButton.addEventListener('click',function () {
        controls.autoRotate = !controls.autoRotate;
        rotateButton.textContent = controls.autoRotate ? 'إيقاف الدوران' : 'تشغيل الدوران';
      });
      renderer.setAnimationLoop(function () {
        controls.update();
        renderer.render(scene,camera);
      });
      setStatus('النموذج جاهز. اسحب للتدوير، واستخدم عجلة الفأرة أو القرص للتكبير. اضغط على عظمة داخل نموذج القسم لفتح صفحتها المستقلة.' + (failed ? ' بعض النماذج لم تُحمّل (' + failed + ').' : ''));
      host._medoraSkeletonCleanup = function () {
        renderer.setAnimationLoop(null);
        observer.disconnect();
        controls.dispose();
        renderer.dispose();
        root.traverse(function (object) {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            materials.forEach(function (material) { material.dispose(); });
          }
        });
      };
    } catch (error) {
      console.error('Medora skeletal atlas:',error);
      host.innerHTML = '<div class="skeletal-viewer-loading"><b>تعذّر تحميل المجسم الآن</b><span>' + String(error.message || error) + '</span><a href="https://bonehub.github.io/Educational-Atlas/" target="_blank" rel="noopener noreferrer">فتح أطلس العظام الأصلي ↗</a></div>';
      setStatus('يمكنك تجربة إعادة تحميل الصفحة أو فتح أطلس المصدر.');
    }
  };

  const route = async function () {
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q') || '';
    if (!query) return;
    try { await loadManifest(); } catch (error) { console.warn('Medora bone manifest unavailable:',error); }
    if (isSystemQuery(query)) { renderSystemPage(); return; }
    const category = categoryForQuery(query);
    if (category) { renderCategoryPage(category); return; }
    const bone = boneForQuery(query);
    if (bone) { renderBonePage(bone); return; }
  };

  window.medoraSkeletalAtlas = {
    categories:categories,
    search:search,
    open:function (query) { window.location.href = topicUrl(query); },
    isSystemQuery:isSystemQuery
  };

  loadManifest().catch(function (error) { console.warn('Medora skeletal index unavailable:',error); });
  route();

  document.addEventListener('click',function (event) {
    const link = event.target.closest('[data-skeletal-open]');
    if (!link) return;
    event.preventDefault();
    window.location.href = topicUrl(link.getAttribute('data-skeletal-open'));
  });
})();