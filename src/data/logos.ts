import brainsome from "@/assets/logo/brainsome.svg?raw";
import dashinFoundation from "@/assets/logo/dashin-foundation.svg?raw";
import adtech from "@/assets/logo/adtech.svg?raw";
import vizor from "@/assets/logo/vizor.svg?raw";
import indrive from "@/assets/logo/indrive.svg?raw";
import faceapp from "@/assets/logo/faceapp.svg?raw";
import quadcode from "@/assets/logo/quadcode.svg?raw";
import playrix from "@/assets/logo/playrix.svg?raw";
import islandKeeper from "@/assets/logo/island-keeper.svg?raw";
import brainrocket from "@/assets/logo/brainrocket.svg?raw";
import foundersCy from "@/assets/logo/founders-cy.svg?raw";
import mellow from "@/assets/logo/mellow.svg?raw";
import justinJoy from "@/assets/logo/justin-joy.svg?raw";
import exinity from "@/assets/logo/exinity.svg?raw";
import smtShipping from "@/assets/logo/smt-shipping.svg?raw";
import togetherForever from "@/assets/logo/together-forever.svg?raw";
import wrike from "@/assets/logo/wrike.svg?raw";
import kpmg from "@/assets/logo/kpmg.svg?raw";
import mayflower from "@/assets/logo/mayflower.svg?raw";
import { media } from "@/data/media";

/** One canonical, processed SVG per partner. No client-side rendering is needed. */
export const logos = {
  brainsome: { svg: brainsome, description: media.brainsomeLogo.description },
  dashinFoundation: {
    svg: dashinFoundation,
    description: media.dashinFoundationLogo.description,
  },
  adtech: { svg: adtech, description: media.adtechLogo.description },
  vizor: { svg: vizor, description: media.vizorLogo.description },
  indrive: { svg: indrive, description: media.indriveLogo.description },
  faceapp: { svg: faceapp, description: media.faceappLogo.description },
  quadcode: { svg: quadcode, description: media.quadcodeLogo.description },
  playrix: { svg: playrix, description: media.playrixLogo.description },
  islandKeeper: {
    svg: islandKeeper,
    description: media.islandKeeperLogo.description,
  },
  brainrocket: {
    svg: brainrocket,
    description: media.brainrocketLogo.description,
  },
  foundersCy: {
    svg: foundersCy,
    description: media.foundersCyLogo.description,
  },
  mellow: { svg: mellow, description: media.mellowLogo.description },
  justinJoy: { svg: justinJoy, description: media.justinJoyLogo.description },
  exinity: { svg: exinity, description: media.exinityLogo.description },
  smtShipping: {
    svg: smtShipping,
    description: media.smtShippingLogo.description,
  },
  togetherForever: {
    svg: togetherForever,
    description: media.togetherForeverLogo.description,
  },
  wrike: { svg: wrike, description: media.wrikeLogo.description },
  kpmg: { svg: kpmg, description: media.kpmgLogo.description },
  mayflower: { svg: mayflower, description: media.mayflowerLogo.description },
} as const;

export type LogoName = keyof typeof logos;
