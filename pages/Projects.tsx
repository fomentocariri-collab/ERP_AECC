import React, { useState } from 'react';
import { PlusCircle, Edit, Trash2, Calendar, User, DollarSign, Briefcase } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { AddProjectModal } from '../components/AddProjectModal';
import { Project, UserRole } from '../types';

interface ProjectsProps { userRole: UserRole; showToast: (msg: string, type?: 'success'|'error') => void; }

const getStatusBadge = (status: Project['status']) => {
    switch(status) {
        case 'Active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
        case 'Planning': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
        case 'Completed': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        case 'Cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    }
}

export const Projects: React.FC<ProjectsProps> = ({ userRole, showToast }) => {
    const { projects, addProject, updateProject, deleteProject } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const canPerformActions = userRole === 'Super Admin' || userRole === 'Financeiro';

    const handleOpenAdd = () => { setEditingProject(null); setIsModalOpen(true); };
    const handleOpenEdit = (project: Project) => { setEditingProject(project); setIsModalOpen(true); };
    const handleDelete = async (id: string) => { if(window.confirm("Excluir projeto?")) { await deleteProject(id); showToast("Excluído!"); } }
    const handleSave = async (data: Omit<Project, 'id'>) => {
        if(editingProject) { await updateProject(editingProject.id, data); showToast("Atualizado!"); }
        else { await addProject(data); showToast("Criado!"); }
    };

    return (
        <>
            <AddProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} existingProject={editingProject} />
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2"><Briefcase className="text-secondary-600" /> Projetos</h2>
                    {canPerformActions && <button onClick={handleOpenAdd} className="flex items-center gap-2 px-4 py-2 bg-secondary-700 text-white rounded-lg hover:bg-secondary-800"><PlusCircle size={18} /> Novo Projeto</button>}
                </div>
                {projects.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-10 text-center shadow-sm border dark:border-gray-700">
                        <Briefcase size={48} className="mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Nenhum projeto cadastrado</h3>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map(project => (
                            <div key={project.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border dark:border-gray-700 flex flex-col hover:border-secondary-400">
                                <div className="p-6 flex-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className={`px-2 py-1 text-xs font-bold rounded-full uppercase ${getStatusBadge(project.status)}`}>{project.status}</span>
                                        {canPerformActions && <div className="flex gap-2"><button onClick={() => handleOpenEdit(project)} className="text-gray-400 hover:text-blue-500"><Edit size={16} /></button><button onClick={() => handleDelete(project.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button></div>}
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">{project.title}</h3>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">{project.description}</p>
                                    <div className="space-y-2 text-sm text-gray-500">
                                        <div className="flex items-center gap-2"><Calendar size={14}/> {new Date(project.startDate).toLocaleDateString()}</div>
                                        <div className="flex items-center gap-2"><User size={14}/> {project.proponent}</div>
                                        <div className="flex items-center gap-2"><DollarSign size={14}/> R$ {project.budget.toLocaleString()}</div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 border-t dark:border-gray-700 rounded-b-xl">
                                    <p className="text-xs text-gray-500 text-center">Patrocinador: <span className="font-medium">{project.sponsor}</span></p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};