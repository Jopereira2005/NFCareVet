import { User, Users } from 'lucide-react';

import { MyActivities, TeamActivities } from '@/components/features';
import { PageHeading } from '@/components/layout';
import { SegmentedControl, type SegmentedOption } from '@/components/ui';
import { useSearchParamState } from '@/hooks/useSearchParamState';

import styles from './tasks.module.scss';

type TasksTab = 'mine' | 'team';

const TASKS_TABS = ['mine', 'team'] as const;

const TAB_OPTIONS: SegmentedOption<TasksTab>[] = [
  { value: 'mine', label: 'Suas Atividades', icon: User },
  { value: 'team', label: 'Atividades Gerais', icon: Users },
];

export default function Tasks() {
  const [activeTab, setActiveTab] = useSearchParamState<TasksTab>('tab', 'mine', TASKS_TABS);

  return (
    <>
      <PageHeading title="Painel de Tarefas" subtitle="Veja tarefas e ações pendentes e passadas, suas e da equipe" />

      <div className={styles['tasks']}>
        <SegmentedControl label="Filtrar atividades" options={TAB_OPTIONS} value={activeTab} onChange={setActiveTab} />
        {activeTab === 'mine' ? <MyActivities /> : <TeamActivities />}
      </div>
    </>
  );
}
