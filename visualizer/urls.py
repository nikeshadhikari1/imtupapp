from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('visualizer/', views.visualizer_page, name='visualizer'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('reports/', views.reports, name='reports'),

    # Classroom URLs
    path('classes/', views.classes_home, name='classes_home'),
    path('classes/create/', views.create_class, name='create_class'),
    path('classes/join/', views.join_class, name='join_class'),
    path('classes/<int:class_id>/', views.class_detail, name='class_detail'),
    path('classes/<int:class_id>/leave/', views.leave_class, name='leave_class'),
    path('classes/<int:class_id>/delete/', views.delete_class, name='delete_class'),
    path('classes/<int:class_id>/remove-member/<int:user_id>/', views.remove_member, name='remove_member'),
    path('classes/<int:class_id>/remove-equation/<int:eq_id>/', views.remove_equation_from_class, name='remove_equation_from_class'),

    # AJAX / API
    path('api/plot/', views.api_plot, name='api_plot'),
    path('api/geometry/', views.api_geometry, name='api_geometry'),
    path('api/save-equation/', views.save_equation, name='save_equation'),
    path('api/my-classes/', views.api_my_classes, name='api_my_classes'),
    path('api/export/', views.export_graph, name='export_graph'),
]
