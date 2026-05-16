import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, MessageSquare, Paperclip, Calendar } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTasks } from '../../features/tasks/tasksSlice';
import { updateTaskAPI } from '../../api/task.api';
import toast from 'react-hot-toast';
import CreateTaskModal from '../../components/tasks/CreateTaskModal';

const priorityColors = {
  low: 'bg-info/10 text-info', medium: 'bg-warning/10 text-warning',
  high: 'bg-danger/10 text-danger', critical: 'bg-danger text-white',
};

const columnMeta = {
  backlog: { title: 'Backlog', dot: 'bg-text-muted', bg: 'bg-background-base/30' },
  todo: { title: 'To Do', dot: 'bg-info', bg: 'bg-info/[0.02]' },
  in_progress: { title: 'In Progress', dot: 'bg-warning', bg: 'bg-warning/[0.02]' },
  in_review: { title: 'In Review', dot: 'bg-accent', bg: 'bg-accent/[0.02]' },
  done: { title: 'Done', dot: 'bg-success', bg: 'bg-success/[0.02]' },
};

const KanbanPage = () => {
  const dispatch = useDispatch();
  const { tasks, loading } = useSelector(state => state.tasks);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const columnOrder = ['backlog', 'todo', 'in_progress', 'in_review', 'done'];
  
  const [columns, setColumns] = useState(() => {
    const cols = {};
    columnOrder.forEach(id => { cols[id] = []; });
    return cols;
  });

  useEffect(() => { dispatch(fetchTasks()); }, [dispatch]);

  useEffect(() => {
    if (!tasks) return;
    const newCols = {};
    columnOrder.forEach(id => { newCols[id] = []; });
    [...tasks].filter(t => newCols[t.status]).sort((a, b) => (a.order || 0) - (b.order || 0)).forEach(task => { newCols[task.status].push(task._id); });
    setColumns(newCols);
  }, [tasks]);

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const startIds = Array.from(columns[source.droppableId]);
    const finishIds = source.droppableId === destination.droppableId ? startIds : Array.from(columns[destination.droppableId]);
    startIds.splice(source.index, 1);
    if (source.droppableId === destination.droppableId) {
      startIds.splice(destination.index, 0, draggableId);
      setColumns({ ...columns, [source.droppableId]: startIds });
    } else {
      finishIds.splice(destination.index, 0, draggableId);
      setColumns({ ...columns, [source.droppableId]: startIds, [destination.droppableId]: finishIds });
    }

    if (source.droppableId !== destination.droppableId) {
      try {
        await updateTaskAPI(draggableId, { status: destination.droppableId });
        toast.success(`Moved to ${columnMeta[destination.droppableId]?.title}`);
      } catch {
        toast.error('Failed to move task');
        dispatch(fetchTasks());
      }
    }
  };

  if (loading && tasks.length === 0) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="h-8 w-48 skeleton" />
        <div className="flex gap-4">
          {[1,2,3,4,5].map(i => <div key={i} className="w-72 h-96 skeleton" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden animate-fadeIn">
      <div className="mb-5 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary">Kanban Board</h1>
          <p className="text-text-secondary text-sm mt-1">{tasks.length} tasks across {columnOrder.length} columns</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>

      <CreateTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-3 h-full items-start min-w-max">
            {columnOrder.map(colId => {
              const colTasks = (columns[colId] || []).map(id => tasks.find(t => t._id === id)).filter(Boolean);
              const meta = columnMeta[colId];

              return (
                <div key={colId} className="w-[280px] flex flex-col max-h-full">
                  {/* Column header */}
                  <div className="flex justify-between items-center mb-2.5 px-1 shrink-0">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${meta.dot}`} />
                      <h3 className="font-display font-semibold text-text-primary text-[13px]">{meta.title}</h3>
                    </div>
                    <span className="text-[10px] font-bold text-text-muted bg-background-hover px-2 py-0.5 rounded-full tabular-nums">{colTasks.length}</span>
                  </div>

                  <Droppable droppableId={colId}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`flex-1 overflow-y-auto min-h-[100px] p-1 rounded-xl transition-all duration-200 space-y-2 ${
                          snapshot.isDraggingOver ? 'bg-accent/[0.04] ring-1 ring-accent/15 ring-inset' : meta.bg
                        }`}
                      >
                        {colTasks.map((task, index) => (
                          <Draggable key={task._id} draggableId={task._id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`bg-background-surface p-3 rounded-xl border cursor-grab active:cursor-grabbing transition-all duration-150 ${
                                  snapshot.isDragging 
                                    ? 'border-accent shadow-modal rotate-[1deg] scale-[1.02]' 
                                    : 'border-border shadow-card hover:shadow-cardHover hover:border-border'
                                }`}
                                style={{ ...provided.draggableProps.style }}
                              >
                                {/* Priority + labels */}
                                <div className="flex flex-wrap gap-1 mb-2">
                                  <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${priorityColors[task.priority]}`}>{task.priority}</span>
                                  {task.labels?.slice(0, 2).map(label => (
                                    <span key={label} className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-background-hover text-text-muted">{label}</span>
                                  ))}
                                </div>

                                {/* Title */}
                                <p className="text-[13px] font-medium text-text-primary mb-1 leading-snug">{task.title}</p>
                                {task.description && <p className="text-[11px] text-text-secondary line-clamp-2 mb-2 leading-relaxed">{task.description}</p>}
                                
                                {/* Due date */}
                                {task.dueDate && (
                                  <div className={`flex items-center gap-1 mb-2 text-[10px] font-medium ${new Date(task.dueDate) < new Date() && task.status !== 'done' ? 'text-danger' : 'text-text-muted'}`}>
                                    <Calendar className="w-3 h-3" />
                                    {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </div>
                                )}

                                {/* Footer */}
                                <div className="flex items-center justify-between pt-2 border-t border-border/60">
                                  <div className="flex gap-3 text-text-muted">
                                    <div className="flex items-center gap-0.5 text-[10px]">
                                      <MessageSquare className="w-3 h-3" /> {task.comments?.length || 0}
                                    </div>
                                    <div className="flex items-center gap-0.5 text-[10px]">
                                      <Paperclip className="w-3 h-3" /> {task.attachments?.length || 0}
                                    </div>
                                  </div>
                                  {task.assignee && (
                                    <div className="w-5 h-5 rounded-md bg-accent/10 flex items-center justify-center text-[8px] text-accent font-bold" title={task.assignee.name}>
                                      {task.assignee.name?.charAt(0)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
};

export default KanbanPage;
