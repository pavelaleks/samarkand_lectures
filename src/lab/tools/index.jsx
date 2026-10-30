import { CleanText, Frequencies, NerLite, NetworkLab, SentimentLab, StylometryLite } from './interactive'
import {
  CloseDistant,
  CorpusPassport,
  MiniPanel,
  PipelineLab,
  PromptLab,
  TopicLite,
  VerifyLab,
} from './guided'
import { ZipfBuild } from './ZipfBuild'
import { ZipfLesson } from './ZipfLesson'
import { StylometryLesson } from './StylometryLesson'
import { NerLesson } from './NerLesson'
import { PipelineLesson } from './PipelineLesson'
import { ColabHandsOn } from './ColabHandsOn'

const TOOLS = {
  CloseDistant,
  CleanText,
  CorpusPassport,
  Frequencies,
  ZipfBuild,
  ZipfLesson,
  StylometryLesson,
  StylometryLite,
  NerLesson,
  NerLite,
  NetworkLab,
  SentimentLab,
  TopicLite,
  PromptLab,
  PipelineLab,
  PipelineLesson,
  MiniPanel,
  VerifyLab,
  ColabHandsOn,
}

export function renderLabTool(name) {
  const Comp = TOOLS[name]
  if (!Comp) {
    return <p className="text-rose-600">Инструмент «{name}» не найден.</p>
  }
  return <Comp />
}
