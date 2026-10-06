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

const TOOLS = {
  CloseDistant,
  CleanText,
  CorpusPassport,
  Frequencies,
  StylometryLite,
  NerLite,
  NetworkLab,
  SentimentLab,
  TopicLite,
  PromptLab,
  PipelineLab,
  MiniPanel,
  VerifyLab,
}

export function renderLabTool(name) {
  const Comp = TOOLS[name]
  if (!Comp) {
    return <p className="text-rose-600">Инструмент «{name}» не найден.</p>
  }
  return <Comp />
}
