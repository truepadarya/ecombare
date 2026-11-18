import teamMask6 from "@/assets/graphics/team-masks/team-mask-6.svg?raw";
import teamMask5 from "@/assets/graphics/team-masks/team-mask-5.svg?raw";
import teamMask4 from "@/assets/graphics/team-masks/team-mask-4.svg?raw";
import teamMask3 from "@/assets/graphics/team-masks/team-mask-3.svg?raw";
import teamMask2 from "@/assets/graphics/team-masks/team-mask-2.svg?raw";
import teamMask1 from "@/assets/graphics/team-masks/team-mask-1.svg?raw";
import { media } from "@/data/media";
export const teamVideos = [
  {
    id: "team-1",
    mask: teamMask6,
    src: media.mariosPolymniouVideo.src,
    photo: media.mariosPolymniouPoster.src,
    name: "Marios Polymniou",
    role: "Founder, CEO",
  },
  {
    id: "team-2",
    mask: teamMask5,
    src: media.kristinaKremkoVideo.src,
    photo: media.kristinaKremkoPoster.src,
    name: "Kristina Kremko",
    role: "Co-Founder, COO",
  },
  {
    id: "team-3",
    mask: teamMask4,
    src: media.nadyaAkulenkaVideo.src,
    photo: media.nadyaAkulenkaPoster.src,
    name: "Nadya Akulenka",
    role: "Tree Certificate Program Lead",
  },
  {
    id: "team-4",
    mask: teamMask3,
    src: media.kostasDanenkouVideo.src,
    photo: media.kostasDanenkouPoster.src,
    name: "Kostas Danenkou",
    role: "Field Operations Manager",
  },
  {
    id: "team-5",
    mask: teamMask2,
    src: media.valeriaSokolovaVideo.src,
    photo: media.valeriaSokolovaPoster.src,
    name: "Valeria Sokolova",
    role: "Volunteering & Community Manager",
  },
  {
    id: "team-6",
    mask: teamMask1,
    src: media.pavelPristalovVideo.src,
    photo: media.pavelPristalovPoster.src,
    name: "Pavel Pristalov",
    role: "Technical Lead",
  },
];
